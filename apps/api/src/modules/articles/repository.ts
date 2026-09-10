import type { TransactionClient } from '@coastal-talk-news/db';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

const withRelations = {
  category: { select: { id: true, name: true } },
  media: mediaSelect,
  ogImage: mediaSelect,
} as const;

export type ArticleRow = Awaited<ReturnType<typeof findById>>;

export interface ListFilters {
  categoryId?: string;
  language?: 'ENGLISH' | 'KANNADA';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  priority?: 'LEAD_STORY' | 'FEATURED' | 'NORMAL';
  /** Matched against headline and contentText, case-insensitive. */
  search?: string;
  sort?: 'newest' | 'oldest';
}

function whereFromFilters(filters: ListFilters) {
  const { categoryId, language, status, priority, search } = filters;
  return {
    ...(categoryId ? { categoryId } : {}),
    ...(language ? { language } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(search
      ? {
          OR: [
            { headline: { contains: search, mode: 'insensitive' as const } },
            {
              contentText: { contains: search, mode: 'insensitive' as const },
            },
          ],
        }
      : {}),
  };
}

export function findById(db: TransactionClient, id: string) {
  return db.article.findUnique({ where: { id }, include: withRelations });
}

export function findMany(
  db: TransactionClient,
  filters: ListFilters,
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: whereFromFilters(filters),
    include: withRelations,
    orderBy: [{ updatedAt: filters.sort === 'oldest' ? 'asc' : 'desc' }],
    ...page,
  });
}

export function count(db: TransactionClient, filters: ListFilters) {
  return db.article.count({ where: whereFromFilters(filters) });
}

/** Grouped counts for the list page's status tabs, honoring every filter but status. */
export function countByStatus(
  db: TransactionClient,
  filters: Omit<ListFilters, 'status'>,
) {
  return db.article.groupBy({
    by: ['status'],
    where: whereFromFilters(filters),
    _count: { _all: true },
  });
}

export interface ArticleWriteData {
  categoryId: string;
  language: 'ENGLISH' | 'KANNADA';
  headline: string;
  summary: string;
  content: object;
  contentText: string;
  youtubeUrl: string | null;
  tags: string[];
  priority: 'LEAD_STORY' | 'FEATURED' | 'NORMAL';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publicationDate: Date | null;
  mediaId: string | null;
  ogImageId: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
}

export function create(db: TransactionClient, data: ArticleWriteData) {
  return db.article.create({ data, include: withRelations });
}

export function update(
  db: TransactionClient,
  id: string,
  data: Partial<ArticleWriteData>,
) {
  return db.article.update({ where: { id }, data, include: withRelations });
}

export function remove(db: TransactionClient, id: string) {
  return db.article.delete({ where: { id }, select: { id: true } });
}

export function categoryExists(db: TransactionClient, categoryId: string) {
  return db.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
}

export function mediaExists(db: TransactionClient, mediaId: string) {
  return db.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
}
