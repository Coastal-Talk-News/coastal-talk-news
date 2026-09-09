import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DashboardStatsDto {
  totalArticles: number;
  publishedToday: number;
  drafts: number;
  archived: number;
  activeBreakingNews: number;
  activeAdvertisements: number;
}

export interface DashboardArticleDto {
  id: Id;
  headline: string;
  status: ArticleStatus;
  categoryName: string;
  publicationDate: IsoDateTime | null;
  updatedAt: IsoDateTime;
  coverImage: MediaSummaryDto | null;
}

export interface DashboardBreakingNewsDto {
  id: Id;
  headline: string;
  startAt: IsoDateTime;
  /** Null means the item runs indefinitely from startAt until deleted. */
  endAt: IsoDateTime | null;
  isActive: boolean;
}

export interface DashboardAdvertisementDto {
  id: Id;
  advertiserName: string;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
  isActive: boolean;
  image: MediaSummaryDto | null;
}

export interface DashboardDto {
  stats: DashboardStatsDto;
  recentArticles: DashboardArticleDto[];
  breakingNews: DashboardBreakingNewsDto[];
  advertisements: DashboardAdvertisementDto[];
}
