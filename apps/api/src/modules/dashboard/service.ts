import type { Database } from '@coastal-talk-news/db';
import { isActiveAt } from '../../lib/schedule.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';

const PREVIEW_LIMIT = 5;

export interface DashboardDeps {
  db: Database;
  storage: ObjectStorage;
}

function startOfToday(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getDashboard(
  { db, storage }: DashboardDeps,
  now = new Date(),
) {
  const [
    byStatus,
    publishedToday,
    activeBreakingNews,
    activeAdvertisements,
    recentArticles,
    breakingNews,
    advertisements,
  ] = await Promise.all([
    repository.countArticlesByStatus(db),
    repository.countPublishedSince(db, startOfToday(now)),
    repository.countActiveBreakingNews(db, now),
    repository.countActiveAdvertisements(db, now),
    repository.findRecentArticles(db, PREVIEW_LIMIT),
    repository.findRecentBreakingNews(db, PREVIEW_LIMIT),
    repository.findRecentAdvertisements(db, PREVIEW_LIMIT),
  ]);

  const countFor = (status: string) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  const toMedia = (
    media: {
      id: string;
      storageKey: string;
      width: number;
      height: number;
    } | null,
  ) =>
    media
      ? {
          id: media.id,
          url: storage.publicUrl(media.storageKey),
          width: media.width,
          height: media.height,
        }
      : null;

  return {
    stats: {
      totalArticles: byStatus.reduce((sum, row) => sum + row._count._all, 0),
      publishedToday,
      drafts: countFor('DRAFT'),
      archived: countFor('ARCHIVED'),
      activeBreakingNews,
      activeAdvertisements,
    },
    recentArticles: recentArticles.map((article) => ({
      id: article.id,
      headline: article.headline,
      status: article.status,
      categoryName: article.category.name,
      publicationDate: article.publicationDate?.toISOString() ?? null,
      updatedAt: article.updatedAt.toISOString(),
      coverImage: toMedia(article.media),
    })),
    breakingNews: breakingNews.map((item) => ({
      id: item.id,
      headline: item.headline,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      isActive: isActiveAt(item, now),
    })),
    advertisements: advertisements.map((ad) => ({
      id: ad.id,
      advertiserName: ad.advertiserName,
      startAt: ad.startAt.toISOString(),
      endAt: ad.endAt.toISOString(),
      isActive: isActiveAt(ad, now),
      image: toMedia(ad.media),
    })),
  };
}
