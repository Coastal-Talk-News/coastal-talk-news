import type { Database } from '@coastal-talk-news/db';
import type { FastifyBaseLogger } from 'fastify';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import * as repository from './repository.js';

export interface BreakingNewsServiceDeps {
  db: Database;
  logger: FastifyBaseLogger;
}

export interface CreateBreakingNewsInput {
  headline: string;
  articleUrl?: string;
  startAt: string;
  /** Omit or null to run indefinitely from startAt until deleted. */
  endAt?: string | null;
}

export type UpdateBreakingNewsInput = Partial<CreateBreakingNewsInput>;

function assertWindow(startAt: Date, endAt: Date | null): void {
  if (endAt && endAt.getTime() <= startAt.getTime()) {
    throw new BadRequestError('endAt must be after startAt.');
  }
}

export async function listForCms(
  { db }: BreakingNewsServiceDeps,
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findMany(db, toSkipTake(pagination)),
    repository.count(db),
  ]);
  return { rows, total };
}

export async function getForCms({ db }: BreakingNewsServiceDeps, id: string) {
  const item = await repository.findById(db, id);
  if (!item) {
    throw new NotFoundError('Breaking news item');
  }
  return item;
}

export async function create(
  { db }: BreakingNewsServiceDeps,
  input: CreateBreakingNewsInput,
) {
  const startAt = new Date(input.startAt);
  const endAt = input.endAt ? new Date(input.endAt) : null;
  assertWindow(startAt, endAt);

  return repository.create(db, {
    headline: input.headline.trim(),
    // No is_active column exists for this model — schema.prisma stores no
    // manual override, only startAt/endAt (CLAUDE.md §13, schema.prisma
    // header). "No link" is represented as '' since articleUrl stays
    // non-null; endAt itself is nullable, meaning "runs until deleted".
    articleUrl: input.articleUrl?.trim() ?? '',
    startAt,
    endAt,
  });
}

export async function update(
  { db }: BreakingNewsServiceDeps,
  id: string,
  input: UpdateBreakingNewsInput,
) {
  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Breaking news item');
  }

  const startAt = input.startAt ? new Date(input.startAt) : existing.startAt;
  // input.endAt === undefined means "leave it alone"; an explicit null means
  // "clear the end date", distinct from an unset key on a PATCH.
  const endAt =
    input.endAt !== undefined
      ? input.endAt
        ? new Date(input.endAt)
        : null
      : existing.endAt;
  assertWindow(startAt, endAt);

  return repository.update(db, id, {
    ...(input.headline !== undefined
      ? { headline: input.headline.trim() }
      : {}),
    ...(input.articleUrl !== undefined
      ? { articleUrl: input.articleUrl.trim() }
      : {}),
    ...(input.startAt !== undefined ? { startAt } : {}),
    ...(input.endAt !== undefined ? { endAt } : {}),
  });
}

export async function remove(
  { db }: BreakingNewsServiceDeps,
  id: string,
): Promise<void> {
  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Breaking news item');
  }
  await repository.remove(db, id);
}
