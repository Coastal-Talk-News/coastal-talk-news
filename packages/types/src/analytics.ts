import type { Id, IsoDateTime } from './api.js';
import type { ArticleStatus, UsageMeterDto } from './dashboard.js';

export type AnalyticsSort = 'views' | 'published' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface AnalyticsStatsDto {
  totalArticles: number;
  publishedToday: number;
  drafts: number;
  archived: number;
  activeBreakingNews: number;
  activeAdvertisements: number;
  /** Reads counted since local midnight. */
  viewsToday: number;
}

/** One day of a chosen calendar week or calendar month - which, and which
 * one exactly, is set by the request that fetched it (`weeksAgo`, or
 * `year`+`month`), not carried on the row itself. */
export interface AnalyticsDailyViewsDto {
  date: IsoDateTime;
  views: number;
}

/** One calendar month of a chosen year, in the Year detail view. */
export interface AnalyticsMonthlyViewsDto {
  /** 1 (January) through 12 (December). */
  month: number;
  views: number;
}

/** The year range to offer navigating Year across, and the exact earliest
 * recorded read, so Week/Month navigation knows where to stop going back.
 * `minYear`/`maxYear` are equal and `earliestDate` is null when there's no
 * read yet. */
export interface AnalyticsYearRangeDto {
  minYear: number;
  maxYear: number;
  earliestDate: IsoDateTime | null;
}

export interface AnalyticsArticleDto {
  id: Id;
  headline: string;
  status: ArticleStatus;
  categoryName: string | null;
  publicationDate: IsoDateTime | null;
  readMinutes: number;
  viewCount: number;
}

export interface DatabaseTableUsageDto {
  table: string;
  bytes: number;
  /** From Postgres's own stats, not an exact live count. */
  rowEstimate: number;
  /** Share of this app's own tables — not of `total`, see DatabaseStorageDto. */
  percent: number;
}

export interface DatabaseStorageDto {
  /** The same figure the Dashboard's Storage meter shows. */
  total: UsageMeterDto;
  /** This app's own tables, largest first. */
  tables: DatabaseTableUsageDto[];
  /** `total` minus the tables above: Supabase's own platform schemas
   *  (`auth`, `storage`, ...) in this database, plus any other database
   *  Postgres keeps alongside it (template databases, and sometimes a
   *  leftover Prisma migration shadow database). */
  otherBytes: number;
}
