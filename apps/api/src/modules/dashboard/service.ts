import type { Database } from '@coastal-talk-news/db';
import { isActiveAt, isActiveAtOpenEnded } from '../../lib/schedule.js';
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

// Supabase's free plan allows 500 MB of database, and a project that goes
// over it is put into read-only mode, so the meter turns red before that.
const SUPABASE_LIMIT_MB = 500;
const SUPABASE_WARN_MB = 450;
// The free Cloudinary plan's monthly allowance.
const CLOUDINARY_WARN_CREDITS = 20;
// The usage figures barely move minute to minute, and the Admin API is
// rate-limited, so a dashboard left open shouldn't ask it every time.
const CLOUDINARY_CACHE_MS = 5 * 60 * 1000;

let cachedCredits: {
  at: number;
  value: { used: number; limit: number };
} | null = null;

async function readCloudinary(storage: ObjectStorage, now: Date) {
  try {
    if (
      !cachedCredits ||
      now.getTime() - cachedCredits.at > CLOUDINARY_CACHE_MS
    ) {
      cachedCredits = { at: now.getTime(), value: await storage.creditUsage() };
    }
    const { used, limit } = cachedCredits.value;
    return { used, limit, warnAt: CLOUDINARY_WARN_CREDITS };
  } catch {
    // A usage meter is never worth failing the dashboard for.
    return null;
  }
}

async function readSupabase(db: Database) {
  try {
    const bytes = await repository.databaseSizeBytes(db);
    return {
      used: Math.round(bytes / 1024 / 1024),
      limit: SUPABASE_LIMIT_MB,
      warnAt: SUPABASE_WARN_MB,
    };
  } catch {
    // A usage meter is never worth failing the dashboard for.
    return null;
  }
}

export async function getUsage(
  { db, storage }: DashboardDeps,
  now = new Date(),
) {
  const [cloudinary, supabase] = await Promise.all([
    readCloudinary(storage, now),
    readSupabase(db),
  ]);
  return { cloudinary, supabase };
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
      activeBreakingNews,
      activeAdvertisements,
    },
    recentArticles: recentArticles.map((article) => ({
      id: article.id,
      headline: article.headline,
      status: article.status,
      categoryName: article.category?.name ?? null,
      publicationDate: article.publicationDate?.toISOString() ?? null,
      updatedAt: article.updatedAt.toISOString(),
      coverImage: toMedia(article.media),
    })),
    breakingNews: breakingNews.map((item) => ({
      id: item.id,
      headline: item.headline,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt ? item.endAt.toISOString() : null,
      isActive: isActiveAtOpenEnded(item, now),
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
