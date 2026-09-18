import type {
  Database,
  Language,
  TransactionClient,
} from '@coastal-talk-news/db';
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
  parentId?: string | null;
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

/**
 * A parent must exist and must itself be top-level — a category whose own
 * parentId is set can never be chosen as someone else's parent, which is what
 * caps the hierarchy at two levels.
 */
async function assertValidParent(
  db: TransactionClient,
  parentId: string,
  excludingId?: string,
): Promise<void> {
  if (parentId === excludingId) {
    throw new BadRequestError('A category cannot be its own parent.');
  }
  const parent = await repository.findParentCandidate(db, parentId);
  if (!parent) {
    throw new BadRequestError(
      'parentId does not refer to an existing category.',
    );
  }
  if (parent.parentId !== null) {
    throw new BadRequestError(
      'parentId refers to a category that is itself a subcategory. Only a top-level category can be a parent.',
    );
  }
}

async function assertNoChildren(
  db: TransactionClient,
  id: string,
  action: string,
): Promise<void> {
  const childCount = await repository.countChildren(db, id);
  if (childCount > 0) {
    throw new ConflictError(
      `Cannot ${action} while ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'} still belong to it. Reassign or remove them first.`,
      { childCount },
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
  filters: { language?: Language },
  pagination: PaginationParams,
) {
  // Reuses getPublic's own visibility rule: an inactive or missing category
  // has no public article listing, regardless of what it still contains.
  await getPublic(deps, categoryId);

  const { db } = deps;
  const [rows, total] = await Promise.all([
    repository.findPublishedArticles(
      db,
      categoryId,
      filters,
      toSkipTake(pagination),
    ),
    repository.countPublishedArticles(db, categoryId, filters),
  ]);
  return { rows, total };
}

export async function create(
  deps: CategoryServiceDeps,
  input: CreateCategoryInput,
) {
  const { db } = deps;
  const name = input.name.trim();
  const parentId = input.parentId ?? null;

  await assertNameAvailable(db, name);
  if (input.coverImageId) {
    await assertMediaExists(db, input.coverImageId);
  }
  if (parentId) {
    await assertValidParent(db, parentId);
  }

  return repository.create(db, {
    name,
    description: input.description?.trim() || null,
    isActive: input.isActive ?? true,
    displayOrder:
      input.displayOrder ?? (await repository.nextDisplayOrder(db, parentId)),
    parentId,
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

  const parentChanged =
    input.parentId !== undefined && input.parentId !== existing.parentId;
  if (parentChanged && input.parentId !== null) {
    await assertValidParent(db, input.parentId as string, id);
    // A category with its own children can't become someone else's child —
    // that would make a third level. This is the real guard behind the CMS's
    // disabled Parent Category dropdown, not just a UI nicety.
    await assertNoChildren(db, id, 'move this category under a parent');
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
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      ...(input.displayOrder !== undefined
        ? { displayOrder: input.displayOrder }
        : parentChanged
          ? {
              displayOrder: await repository.nextDisplayOrder(
                tx,
                input.parentId ?? null,
              ),
            }
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
  parentId: string | null,
  ids: string[],
): Promise<void> {
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    throw new BadRequestError('ids contains duplicate entries.');
  }

  const groupLabel = parentId === null ? 'the top level' : 'this parent';

  await db.$transaction(async (tx) => {
    const total = await repository.countInParent(tx, parentId);
    if (ids.length !== total) {
      throw new ConflictError(
        `Reorder must include every category in ${groupLabel}. Received ${ids.length} of ${total}.`,
        { received: ids.length, expected: total },
      );
    }

    const found = await repository.findIdsInParent(tx, parentId, ids);
    if (found.length !== ids.length) {
      throw new BadRequestError(
        `ids contains a category that does not exist, or is not in ${groupLabel}.`,
      );
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
    await assertNoChildren(tx, id, 'delete this category');

    await repository.remove(tx, id);
    return releaseMedia(tx, [existing.mediaId]);
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
}
