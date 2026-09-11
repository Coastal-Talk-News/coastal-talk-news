import type { Database } from '@coastal-talk-news/db';
import type { FastifyBaseLogger } from 'fastify';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import { releaseMedia } from '../media/reference.js';
import { purgeStorageObjects } from '../media/service.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';

export interface AdvertisementServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
}

export interface CreateAdvertisementInput {
  advertiserName: string;
  mediaId: string;
  destinationUrl: string;
  priority?: number;
  startAt: string;
  endAt: string;
}

export type UpdateAdvertisementInput = Partial<CreateAdvertisementInput>;

async function assertMediaExists(db: Database, mediaId: string): Promise<void> {
  if (!(await repository.mediaExists(db, mediaId))) {
    throw new BadRequestError(
      'mediaId does not refer to an existing media asset.',
    );
  }
}

function assertWindow(startAt: Date, endAt: Date): void {
  if (endAt.getTime() <= startAt.getTime()) {
    throw new BadRequestError('endAt must be after startAt.');
  }
}

export async function listForCms(
  { db }: AdvertisementServiceDeps,
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findMany(db, toSkipTake(pagination)),
    repository.count(db),
  ]);
  return { rows, total };
}

export async function getForCms({ db }: AdvertisementServiceDeps, id: string) {
  const item = await repository.findById(db, id);
  if (!item) {
    throw new NotFoundError('Advertisement');
  }
  return item;
}

export async function create(
  { db }: AdvertisementServiceDeps,
  input: CreateAdvertisementInput,
) {
  await assertMediaExists(db, input.mediaId);

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  assertWindow(startAt, endAt);

  return repository.create(db, {
    advertiserName: input.advertiserName.trim(),
    mediaId: input.mediaId,
    destinationUrl: input.destinationUrl.trim(),
    priority: input.priority ?? 0,
    startAt,
    endAt,
  });
}

export async function update(
  deps: AdvertisementServiceDeps,
  id: string,
  input: UpdateAdvertisementInput,
) {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Advertisement');
  }

  if (input.mediaId) {
    await assertMediaExists(db, input.mediaId);
  }

  const startAt = input.startAt ? new Date(input.startAt) : existing.startAt;
  const endAt = input.endAt ? new Date(input.endAt) : existing.endAt;
  assertWindow(startAt, endAt);

  const mediaChanged =
    input.mediaId !== undefined && input.mediaId !== existing.media.id;

  const { advertisement, orphanedKeys } = await db.$transaction(async (tx) => {
    const advertisement = await repository.update(tx, id, {
      ...(input.advertiserName !== undefined
        ? { advertiserName: input.advertiserName.trim() }
        : {}),
      ...(input.mediaId !== undefined ? { mediaId: input.mediaId } : {}),
      ...(input.destinationUrl !== undefined
        ? { destinationUrl: input.destinationUrl.trim() }
        : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.startAt !== undefined ? { startAt } : {}),
      ...(input.endAt !== undefined ? { endAt } : {}),
    });

    const orphanedKeys = mediaChanged
      ? await releaseMedia(tx, [existing.media.id])
      : [];

    return { advertisement, orphanedKeys };
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  return advertisement;
}

export async function remove(
  deps: AdvertisementServiceDeps,
  id: string,
): Promise<void> {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Advertisement');
  }

  const orphanedKeys = await db.$transaction(async (tx) => {
    await repository.remove(tx, id);
    return releaseMedia(tx, [existing.media.id]);
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
}
