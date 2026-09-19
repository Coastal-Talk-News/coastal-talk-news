import type { Language, TransactionClient } from '@coastal-talk-news/db';
import { cardSelect } from '../public/repository.js';

const withMedia = {
  media: {
    select: { id: true, storageKey: true, width: true, height: true },
  },
} as const;

const withCounts = {
  _count: { select: { articles: true } },
} as const;

export type CategoryRow = Awaited<ReturnType<typeof findById>>;
export type CategoryRowWithCount = Awaited<
  ReturnType<typeof findByIdWithCount>
>;

export interface ListFilters {
  isActive?: boolean;
}

export function findById(db: TransactionClient, id: string) {
  return db.category.findUnique({
    where: { id },
    include: withMedia,
  });
}

export function findByIdWithCount(db: TransactionClient, id: string) {
  return db.category.findUnique({
    where: { id },
    include: { ...withMedia, ...withCounts },
  });
}

export function findByName(db: TransactionClient, name: string) {
  return db.category.findUnique({ where: { name }, select: { id: true } });
}

export function findMany(
  db: TransactionClient,
  filters: ListFilters,
  page: { skip: number; take: number },
) {
  return db.category.findMany({
    where: filters,
    include: { ...withMedia, ...withCounts },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    ...page,
  });
}

export function count(db: TransactionClient, filters: ListFilters) {
  return db.category.count({ where: filters });
}

export function create(
  db: TransactionClient,
  data: {
    name: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
    parentId: string | null;
    mediaId: string | null;
  },
) {
  return db.category.create({ data, include: { ...withMedia, ...withCounts } });
}

export function update(
  db: TransactionClient,
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    displayOrder?: number;
    parentId?: string | null;
    mediaId?: string | null;
  },
) {
  return db.category.update({
    where: { id },
    data,
    include: { ...withMedia, ...withCounts },
  });
}

export function setDisplayOrder(
  db: TransactionClient,
  id: string,
  displayOrder: number,
) {
  return db.category.update({
    where: { id },
    data: { displayOrder },
    select: { id: true },
  });
}

export function findIds(db: TransactionClient, ids: string[]) {
  return db.category.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
}

export function remove(db: TransactionClient, id: string) {
  return db.category.delete({ where: { id }, select: { id: true } });
}

export function countArticles(db: TransactionClient, categoryId: string) {
  return db.article.count({ where: { categoryId } });
}

/** Siblings sharing one parent (or the top-level group, when parentId is null). */
export function countInParent(db: TransactionClient, parentId: string | null) {
  return db.category.count({ where: { parentId } });
}

export function findIdsInParent(
  db: TransactionClient,
  parentId: string | null,
  ids: string[],
) {
  return db.category.findMany({
    where: { id: { in: ids }, parentId },
    select: { id: true },
  });
}

export async function nextDisplayOrder(
  db: TransactionClient,
  parentId: string | null,
): Promise<number> {
  const last = await db.category.findFirst({
    where: { parentId },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  return last ? last.displayOrder + 1 : 0;
}

export function countChildren(db: TransactionClient, id: string) {
  return db.category.count({ where: { parentId: id } });
}

/** Just enough to validate a proposed parent: does it exist? */
export function findParentCandidate(db: TransactionClient, id: string) {
  return db.category.findUnique({
    where: { id },
    select: { id: true },
  });
}

/**
 * Every descendant of `id`, any number of levels down — walked level by
 * level rather than with a recursive CTE, since the tree is small and this
 * keeps the query shape consistent with the rest of the module. Used to
 * reject a reparent that would make a category its own descendant's child.
 */
export async function findDescendantIds(
  db: TransactionClient,
  id: string,
): Promise<Set<string>> {
  const descendants = new Set<string>();
  let frontier = [id];
  while (frontier.length > 0) {
    const children = await db.category.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((child) => child.id);
    for (const childId of frontier) descendants.add(childId);
  }
  return descendants;
}

export function mediaExists(db: TransactionClient, mediaId: string) {
  return db.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
}

export type PublishedArticleRow = Awaited<
  ReturnType<typeof findPublishedArticles>
>[number];

export function findPublishedArticles(
  db: TransactionClient,
  categoryId: string,
  { language }: { language?: Language },
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: { categoryId, status: 'PUBLISHED', ...(language && { language }) },
    orderBy: [{ publicationDate: 'desc' }, { createdAt: 'desc' }],
    select: cardSelect,
    ...page,
  });
}

export function countPublishedArticles(
  db: TransactionClient,
  categoryId: string,
  { language }: { language?: Language } = {},
) {
  return db.article.count({
    where: { categoryId, status: 'PUBLISHED', ...(language && { language }) },
  });
}
