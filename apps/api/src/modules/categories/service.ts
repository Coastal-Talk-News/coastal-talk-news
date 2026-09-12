import type { Database } from '@coastal-talk-news/db';
import type { FastifyBaseLogger } from 'fastify';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import { purgeStorageObjects } from '../media/service.js';
import { releaseMedia } from '../media/reference.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';

export interface CategoryServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  coverImageId?: string | null;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

async function assertNameAvailable(
  db: Database,
  name: string,
  excludingId?: string,
): Promise<void> {
  const existing = await repository.findByName(db, name);
  if (existing && existing.id !== excludingId) {
    throw new ConflictError(`A category named "${name}" already exists.`);
  }
}

async function assertMediaExists(db: Database, mediaId: string): Promise<void> {
  if (!(await repository.mediaExists(db, mediaId))) {
    throw new BadRequestError(
      'coverImageId does not refer to an existing media asset.',
    );
  }
}

export async function listForCms(
  { db }: CategoryServiceDeps,
  filters: repository.ListFilters,
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findMany(db, filters, toSkipTake(pagination)),
    repository.count(db, filters),
  ]);
  return { rows, total };
}

export async function listPublic(
  { db }: CategoryServiceDeps,
  pagination: PaginationParams,
) {
  const filters = { isActive: true };
  const [rows, total] = await Promise.all([
    repository.findMany(db, filters, toSkipTake(pagination)),
    repository.count(db, filters),
  ]);
  return { rows, total };
}

export async function getForCms({ db }: CategoryServiceDeps, id: string) {
  const category = await repository.findByIdWithCount(db, id);
  if (!category) {
    throw new NotFoundError('Category');
  }
  return category;
}

export async function getPublic({ db }: CategoryServiceDeps, id: string) {
  const category = await repository.findById(db, id);
  if (!category || !category.isActive) {
    throw new NotFoundError('Category');
  }
  return category;
}

export async function listPublicArticles(
  deps: CategoryServiceDeps,
  categoryId: string,
  pagination: PaginationParams,
) {
  // Reuses getPublic's own visibility rule: an inactive or missing category
  // has no public article listing, regardless of what it still contains.
  await getPublic(deps, categoryId);

  const { db } = deps;
  const [rows, total] = await Promise.all([
    repository.findPublishedArticles(db, categoryId, toSkipTake(pagination)),
    repository.countPublishedArticles(db, categoryId),
  ]);
  return { rows, total };
}

export async function create(
  deps: CategoryServiceDeps,
  input: CreateCategoryInput,
) {
  const { db } = deps;
  const name = input.name.trim();

  await assertNameAvailable(db, name);
  if (input.coverImageId) {
    await assertMediaExists(db, input.coverImageId);
  }

  return repository.create(db, {
    name,
    description: input.description?.trim() || null,
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? (await repository.nextDisplayOrder(db)),
    mediaId: input.coverImageId ?? null,
  });
}

export async function update(
  deps: CategoryServiceDeps,
  id: string,
  input: UpdateCategoryInput,
) {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Category');
  }

  const name = input.name?.trim();
  if (name) {
    await assertNameAvailable(db, name, id);
  }
  if (input.coverImageId) {
    await assertMediaExists(db, input.coverImageId);
  }

  const coverImageChanged =
    input.coverImageId !== undefined && input.coverImageId !== existing.mediaId;

  const { category, orphanedKeys } = await db.$transaction(async (tx) => {
    const category = await repository.update(tx, id, {
      ...(name !== undefined ? { name } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.displayOrder !== undefined
        ? { displayOrder: input.displayOrder }
        : {}),
      ...(input.coverImageId !== undefined
        ? { mediaId: input.coverImageId }
        : {}),
    });

    const orphanedKeys = coverImageChanged
      ? await releaseMedia(tx, [existing.mediaId])
      : [];

    return { category, orphanedKeys };
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  return category;
}

export async function reorder(
  { db }: CategoryServiceDeps,
  ids: string[],
): Promise<void> {
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new BadRequestError('ids contains duplicate entries.');
  }

  await db.$transaction(async (tx) => {
    const total = await repository.count(tx, {});
    if (ids.length !== total) {
      throw new ConflictError(
        `Reorder must include every category. Received ${ids.length} of ${total}.`,
        { received: ids.length, expected: total },
      );
    }

    const found = await repository.findIds(tx, ids);
    if (found.length !== ids.length) {
      throw new BadRequestError('ids contains a category that does not exist.');
    }

    for (const [index, id] of ids.entries()) {
      await repository.setDisplayOrder(tx, id, index);
    }
  });
}

export async function remove(
  deps: CategoryServiceDeps,
  id: string,
): Promise<void> {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Category');
  }

  const orphanedKeys = await db.$transaction(async (tx) => {
    const articleCount = await repository.countArticles(tx, id);
    if (articleCount > 0) {
      throw new ConflictError(
        `Cannot delete this category while ${articleCount} article(s) still belong to it. Reassign or remove them first.`,
        { articleCount },
      );
    }

    await repository.remove(tx, id);
    return releaseMedia(tx, [existing.mediaId]);
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
}
