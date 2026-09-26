import type { Id, IsoDateTime } from './api.js';
import type { ArticleStatus } from './dashboard.js';

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
