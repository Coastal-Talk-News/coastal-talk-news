import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DashboardStatsDto {
  totalArticles: number;
  publishedToday: number;
  activeBreakingNews: number;
  activeAdvertisements: number;
}

export interface DashboardArticleDto {
  id: Id;
  headline: string;
  status: ArticleStatus;
  categoryName: string | null;
  publicationDate: IsoDateTime | null;
  updatedAt: IsoDateTime;
  coverImage: MediaSummaryDto | null;
}

export interface DashboardBreakingNewsDto {
  id: Id;
  headline: string;
  startAt: IsoDateTime;
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

/** One usage figure against its plan limit, in whatever unit the meter shows. */
export interface UsageMeterDto {
  used: number;
  limit: number;
  /** The reading at which the CMS should flag the meter as running out. */
  warnAt: number;
}

export interface DashboardUsageDto {
  /** Credits this billing period; null when Cloudinary could not be reached,
   *  or when a different storage provider is active - Cloudinary credits
   *  aren't a meaningful figure then. Check `storageProvider` before
   *  rendering this, rather than just treating null as "unavailable". */
  cloudinary: UsageMeterDto | null;
  /** Size of the Supabase database in MB; null when it could not be read. */
  supabase: UsageMeterDto | null;
  /** Total size of every stored image in MB, against MEDIA_STORAGE_CAP_MB.
   *  Present regardless of which storage provider is active. */
  mediaStorage: UsageMeterDto | null;
  /** Which backend is currently storing images. */
  storageProvider: 'cloudinary' | 's3';
}

export interface DashboardDto {
  stats: DashboardStatsDto;
  recentArticles: DashboardArticleDto[];
  breakingNews: DashboardBreakingNewsDto[];
  advertisements: DashboardAdvertisementDto[];
}
