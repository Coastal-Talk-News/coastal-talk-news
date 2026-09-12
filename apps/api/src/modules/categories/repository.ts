import type { TransactionClient } from '@coastal-talk-news/db';
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

export async function nextDisplayOrder(db: TransactionClient): Promise<number> {
  const last = await db.category.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  return last ? last.displayOrder + 1 : 0;
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
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: { categoryId, status: 'PUBLISHED' },
    orderBy: [{ publicationDate: 'desc' }, { createdAt: 'desc' }],
    select: cardSelect,
    ...page,
  });
}

export function countPublishedArticles(
  db: TransactionClient,
  categoryId: string,
) {
  return db.article.count({ where: { categoryId, status: 'PUBLISHED' } });
}
