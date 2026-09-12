import type { TransactionClient } from '@coastal-talk-news/db';
import { activeWindowWhere } from '../../lib/schedule.js';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

const cardSelect = {
  id: true,
  headline: true,
  summary: true,
  language: true,
  publicationDate: true,
  category: { select: { id: true, name: true } },
  media: mediaSelect,
} as const;

export type ArticleCardRow = Awaited<
  ReturnType<typeof findRecentForCategories>
>[number];
export type NavCategoryRow = Awaited<
  ReturnType<typeof findNavCategories>
>[number];

const publishedWhere = { status: 'PUBLISHED' } as const;

const newestFirst: Array<{ publicationDate?: 'desc'; createdAt?: 'desc' }> = [
  { publicationDate: 'desc' },
  { createdAt: 'desc' },
];

export function findSettings(db: TransactionClient) {
  return db.siteSettings.findFirst({
    select: {
      siteName: true,
      tagline: true,
      description: true,
      contactEmail: true,
      contactPhone: true,
      contactAddress: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      xUrl: true,
      logo: mediaSelect,
    },
  });
}

export function findNavCategories(db: TransactionClient) {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      media: mediaSelect,
      _count: { select: { articles: { where: publishedWhere } } },
    },
  });
}

export function findActiveBreakingNews(db: TransactionClient, now: Date) {
  return db.breakingNews.findMany({
    where: {
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
    orderBy: { startAt: 'desc' },
    select: { id: true, headline: true, articleUrl: true },
    take: 10,
  });
}

export function findActiveAdvertisements(db: TransactionClient, now: Date) {
  return db.advertisement.findMany({
    where: activeWindowWhere(now),
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      advertiserName: true,
      destinationUrl: true,
      placement: true,
      media: mediaSelect,
    },
  });
}

/**
 * One query for every category section rather than one per category: fetch a
 * window of recent articles and group them in memory.
 */
export function findRecentForCategories(
  db: TransactionClient,
  categoryIds: string[],
  take: number,
) {
  return db.article.findMany({
    where: { ...publishedWhere, categoryId: { in: categoryIds } },
    orderBy: newestFirst,
    select: cardSelect,
    take,
  });
}
