import type { TransactionClient } from '@coastal-talk-news/db';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

export function countArticlesByStatus(db: TransactionClient) {
  return db.article.groupBy({ by: ['status'], _count: { _all: true } });
}

export function countPublishedSince(db: TransactionClient, since: Date) {
  return db.article.count({
    where: { status: 'PUBLISHED', publicationDate: { gte: since } },
  });
}

export function countActiveBreakingNews(db: TransactionClient, now: Date) {
  return db.breakingNews.count({
    where: { startAt: { lte: now }, endAt: { gte: now } },
  });
}

export function countActiveAdvertisements(db: TransactionClient, now: Date) {
  return db.advertisement.count({
    where: { startAt: { lte: now }, endAt: { gte: now } },
  });
}

export function findRecentArticles(db: TransactionClient, take: number) {
  return db.article.findMany({
    orderBy: { updatedAt: 'desc' },
    take,
    select: {
      id: true,
      headline: true,
      status: true,
      publicationDate: true,
      updatedAt: true,
      category: { select: { name: true } },
      media: mediaSelect,
    },
  });
}

export function findRecentBreakingNews(db: TransactionClient, take: number) {
  return db.breakingNews.findMany({
    orderBy: { startAt: 'desc' },
    take,
    select: { id: true, headline: true, startAt: true, endAt: true },
  });
}

export function findRecentAdvertisements(db: TransactionClient, take: number) {
  return db.advertisement.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take,
    select: {
      id: true,
      advertiserName: true,
      startAt: true,
      endAt: true,
      media: mediaSelect,
    },
  });
}
