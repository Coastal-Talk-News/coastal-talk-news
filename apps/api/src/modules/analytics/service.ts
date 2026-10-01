import type { Database } from '@coastal-talk-news/db';
import { estimateReadMinutes } from '@coastal-talk-news/types';
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

export async function getStats(db: Database, now = new Date()) {
  const [
    byStatus,
    publishedToday,
    activeBreakingNews,
    activeAdvertisements,
    totalViews,
  ] = await Promise.all([
    dashboardRepository.countArticlesByStatus(db),
    dashboardRepository.countPublishedSince(db, startOfToday(now)),
    dashboardRepository.countActiveBreakingNews(db, now),
    dashboardRepository.countActiveAdvertisements(db, now),
    repository.sumViews(db),
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
    totalViews,
  };
}

export async function listArticles(db: Database, pagination: PaginationParams) {
  const [rows, total] = await Promise.all([
    repository.findArticlesByViews(db, toSkipTake(pagination)),
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
