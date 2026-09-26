import type { Database } from '@coastal-talk-news/db';
import { estimateReadMinutes } from '@coastal-talk-news/types';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
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
