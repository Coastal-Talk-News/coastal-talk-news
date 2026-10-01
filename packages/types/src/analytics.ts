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
  /** Reads in the trailing 7/30/365 days — a rolling window, not the
   * calendar week/month/year, so there's no reset at a boundary. */
  viewsThisWeek: number;
  viewsThisMonth: number;
  viewsThisYear: number;
}

/** One day in the "This Week" detail table. */
export interface AnalyticsDailyViewsDto {
  date: IsoDateTime;
  views: number;
}

/** One rolling 7-day span in the "This Month" detail table, oldest span
 * shorter when 30 doesn't divide evenly by 7. */
export interface AnalyticsWeeklyViewsDto {
  from: IsoDateTime;
  to: IsoDateTime;
  views: number;
}

/** One calendar month of a chosen year, in the "This Year" detail table. */
export interface AnalyticsMonthlyViewsDto {
  /** 1 (January) through 12 (December). */
  month: number;
  views: number;
}

/** The years worth offering in the year picker: from the earliest recorded
 * read through the current year. Equal when there's no read yet. */
export interface AnalyticsYearRangeDto {
  minYear: number;
  maxYear: number;
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
