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

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** The Monday on or before this date. ISO weeks (Monday first), to match
 * the calendar-aligned "Month" and "Year" breakdowns rather than a rolling
 * trailing-7-days window with no fixed start. */
function startOfWeek(date: Date): Date {
  const start = startOfToday(date);
  const dayOfWeek = start.getDay(); // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDays(start, -daysSinceMonday);
}

export async function getStats(db: Database, now = new Date()) {
  const [
    byStatus,
    publishedToday,
    activeBreakingNews,
    activeAdvertisements,
    viewsToday,
  ] = await Promise.all([
    dashboardRepository.countArticlesByStatus(db),
    dashboardRepository.countPublishedSince(db, startOfToday(now)),
    dashboardRepository.countActiveBreakingNews(db, now),
    dashboardRepository.countActiveAdvertisements(db, now),
    repository.countViewsSince(db, startOfToday(now)),
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
    viewsToday,
  };
}

/**
 * One row per day of a calendar week (Monday through Sunday), oldest first -
 * the "Week" card's detail. `weeksAgo` counts whole weeks back from the one
 * containing today (0 = this week, 1 = last week, and so on). The current
 * week stops at today rather than running into days that haven't happened;
 * every earlier week returns the full seven days.
 */
export async function getWeekViews(
  db: Database,
  weeksAgo: number,
  now = new Date(),
) {
  const weekStart = addDays(startOfWeek(now), -7 * weeksAgo);
  const lastDay = weeksAgo === 0 ? startOfToday(now) : addDays(weekStart, 6);
  const dayCount =
    Math.round(
      (lastDay.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  const days = Array.from({ length: dayCount }, (_, i) =>
    addDays(weekStart, i),
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
 * One row per day of the given calendar month, oldest first - the "Month"
 * card's detail. For the current month this stops at today; a past month
 * returns every day it actually had.
 */
export async function getMonthViews(
  db: Database,
  year: number,
  month: number,
  now = new Date(),
) {
  const monthStart = new Date(year, month - 1, 1);
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const lastDay = isCurrentMonth ? startOfToday(now) : new Date(year, month, 0); // day 0 of next month = last day of this one
  const dayCount =
    Math.round(
      (lastDay.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  const days = Array.from({ length: Math.max(0, dayCount) }, (_, i) =>
    addDays(monthStart, i),
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
 * Every calendar month of the given year, oldest first — the "Year" card's
 * detail. For the current year this stops at the current month; months
 * later in the year haven't happened yet, so there is nothing to report for
 * them. A past year still returns all twelve.
 */
export async function getMonthlyViews(
  db: Database,
  year: number,
  now = new Date(),
) {
  const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;
  const months = Array.from({ length: lastMonth + 1 }, (_, i) => i);
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

/**
 * The year range and exact earliest moment with any recorded read, so the
 * CMS can grey out "previous" once Week/Month/Year navigation would go
 * further back than there is any real data to show.
 */
export async function getYearRange(db: Database, now = new Date()) {
  const earliest = await repository.earliestViewDate(db);
  const maxYear = now.getFullYear();
  return {
    minYear: earliest ? earliest.getFullYear() : maxYear,
    maxYear,
    earliestDate: earliest ? earliest.toISOString() : null,
  };
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
