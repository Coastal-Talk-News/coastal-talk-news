import type { Id, IsoDateTime } from './api.js';
import type { ArticleStatus, UsageMeterDto } from './dashboard.js';

export interface AnalyticsStatsDto {
  totalArticles: number;
  publishedToday: number;
  drafts: number;
  archived: number;
  activeBreakingNews: number;
  activeAdvertisements: number;
  totalViews: number;
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
