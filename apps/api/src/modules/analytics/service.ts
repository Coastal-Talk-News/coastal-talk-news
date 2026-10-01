import type { Database } from '@coastal-talk-news/db';
import {
  estimateReadMinutes,
  type AnalyticsSort,
  type SortOrder,
} from '@coastal-talk-news/types';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import {
  bytesToMB,
  SUPABASE_LIMIT_MB,
  SUPABASE_WARN_MB,
} from '../dashboard/service.js';
import * as dashboardRepository from '../dashboard/repository.js';
import * as repository from './repository.js';

function startOfToday(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Today is the calendar day so far; the rest are rolling windows (the
// trailing 7, 30 and 365 days) rather than calendar week/month/year, so
// there's no Monday- or 1st-of-the-month cliff where a count resets to zero.
async function getViewPeriods(db: Database, now: Date) {
  const [today, week, month, year] = await Promise.all([
    repository.countViewsSince(db, startOfToday(now)),
    repository.countViewsSince(db, daysAgo(now, 7)),
    repository.countViewsSince(db, daysAgo(now, 30)),
    repository.countViewsSince(db, daysAgo(now, 365)),
  ]);
  return {
    viewsToday: today,
    viewsThisWeek: week,
    viewsThisMonth: month,
    viewsThisYear: year,
  };
}

export async function getStats(db: Database, now = new Date()) {
  const [
    byStatus,
    publishedToday,
    activeBreakingNews,
    activeAdvertisements,
    viewPeriods,
  ] = await Promise.all([
    dashboardRepository.countArticlesByStatus(db),
    dashboardRepository.countPublishedSince(db, startOfToday(now)),
    dashboardRepository.countActiveBreakingNews(db, now),
    dashboardRepository.countActiveAdvertisements(db, now),
    getViewPeriods(db, now),
  ]);

  const countFor = (status: string) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    totalArticles: byStatus.reduce((sum, row) => sum + row._count._all, 0),
    publishedToday,
    drafts: countFor('DRAFT'),
    archived: countFor('ARCHIVED'),
    activeBreakingNews,
    activeAdvertisements,
    ...viewPeriods,
  };
}

const DAYS_IN_WEEK_DETAIL = 7;
const DAYS_IN_MONTH_DETAIL = 30;
const DAYS_PER_WEEKLY_BUCKET = 7;

/** One row per day of the trailing week, oldest first — the "This Week"
 * card's detail. */
export async function getDailyViews(db: Database, now = new Date()) {
  const todayStart = startOfToday(now);
  const days = Array.from({ length: DAYS_IN_WEEK_DETAIL }, (_, i) =>
    addDays(todayStart, -(DAYS_IN_WEEK_DETAIL - 1 - i)),
  );
  const counts = await Promise.all(
    days.map((day) => repository.countViewsBetween(db, day, addDays(day, 1))),
  );
  return days.map((day, i) => ({
    date: day.toISOString(),
    views: counts[i] ?? 0,
  }));
}

/**
 * The trailing 30 days split into 7-day spans, most recent first — the "This
 * Month" card's detail. 30 doesn't divide evenly by 7, so the oldest span is
 * shorter (2 days) rather than reaching past the 30-day window.
 */
export async function getWeeklyViews(db: Database, now = new Date()) {
  const windowEnd = addDays(startOfToday(now), 1);
  const spans: Array<{ from: Date; to: Date }> = [];
  let cursor = windowEnd;
  let remaining = DAYS_IN_MONTH_DETAIL;
  while (remaining > 0) {
    const size = Math.min(DAYS_PER_WEEKLY_BUCKET, remaining);
    const from = addDays(cursor, -size);
    spans.push({ from, to: cursor });
    cursor = from;
    remaining -= size;
  }

  const counts = await Promise.all(
    spans.map((span) => repository.countViewsBetween(db, span.from, span.to)),
  );
  return spans.map((span, i) => ({
    from: span.from.toISOString(),
    // The span's upper bound is exclusive (midnight), so its last real day
    // is the one before it.
    to: addDays(span.to, -1).toISOString(),
    views: counts[i] ?? 0,
  }));
}

/** Every calendar month of the given year — the "This Year" card's detail. */
export async function getMonthlyViews(db: Database, year: number) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const counts = await Promise.all(
    months.map((month) =>
      repository.countViewsBetween(
        db,
        new Date(year, month, 1),
        new Date(year, month + 1, 1),
      ),
    ),
  );
  return months.map((month, i) => ({
    month: month + 1,
    views: counts[i] ?? 0,
  }));
}

export async function getYearRange(db: Database, now = new Date()) {
  const earliest = await repository.earliestViewDate(db);
  const maxYear = now.getFullYear();
  return { minYear: earliest ? earliest.getFullYear() : maxYear, maxYear };
}

export async function listArticles(
  db: Database,
  sorting: { sort: AnalyticsSort; order: SortOrder },
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findArticles(db, sorting, toSkipTake(pagination)),
    repository.countArticles(db),
  ]);
  return {
    rows: rows.map((article) => ({
      id: article.id,
      headline: article.headline,
      status: article.status,
      categoryName: article.category?.name ?? null,
      publicationDate: article.publicationDate?.toISOString() ?? null,
      readMinutes: estimateReadMinutes(article.content),
      viewCount: article.viewCount,
    })),
    total,
  };
}

/**
 * The Dashboard shows one number for the whole project's database; this
 * breaks it down by table, so a large figure there is actually explainable.
 * `otherBytes` is the gap between that total and the tables below: this app's
 * own tables (in the `public` schema) are listed individually, but Supabase
 * provisions its own platform schemas (`auth`, `storage`, ...) in the same
 * database for features this app doesn't use, and Postgres keeps more than
 * one database per project besides (Supabase's own template databases, and
 * sometimes a leftover Prisma shadow database from a `migrate dev` run) —
 * `otherBytes` is everything outside this app's own tables.
 */
export async function getStorage(db: Database) {
  const [totalBytes, tables] = await Promise.all([
    dashboardRepository.databaseSizeBytes(db),
    repository.tableSizes(db),
  ]);

  const tableBytes = tables.reduce((sum, row) => sum + row.bytes, 0n);

  return {
    total: {
      used: bytesToMB(totalBytes),
      limit: SUPABASE_LIMIT_MB,
      warnAt: SUPABASE_WARN_MB,
    },
    tables: tables.map((row) => ({
      table: row.table,
      bytes: Number(row.bytes),
      rowEstimate: Number(row.rowEstimate),
      // Of this app's own tables, not of `total` — the other databases below
      // have no tables of their own to share that percentage with.
      percent:
        tableBytes > 0n
          ? Math.round((Number(row.bytes) / Number(tableBytes)) * 1000) / 10
          : 0,
    })),
    otherBytes: Math.max(0, totalBytes - Number(tableBytes)),
  };
}
