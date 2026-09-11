import type { Id, IsoDateTime } from './api.js';
import type { ArticleStatus } from './dashboard.js';
import type { MediaSummaryDto } from './media.js';

export type Language = 'ENGLISH' | 'KANNADA';
export type ArticlePriority = 'LEAD_STORY' | 'FEATURED' | 'NORMAL';

export interface ArticleContent {
  type: 'doc';
  content: unknown[];
}

export interface ArticleDto {
  id: Id;
  categoryId: Id | null;
  categoryName: string | null;
  language: Language;
  headline: string;
  summary: string;
  content: ArticleContent;
  youtubeUrl: string | null;
  tags: string[];
  priority: ArticlePriority;
  status: ArticleStatus;
  /** Null until first published. */
  publicationDate: IsoDateTime | null;
  seoTitle: string | null;
  metaDescription: string | null;
  featuredImage: MediaSummaryDto | null;
  ogImage: MediaSummaryDto | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export type CreatableArticleStatus = Extract<
  ArticleStatus,
  'DRAFT' | 'PUBLISHED'
>;

export interface CreateArticleRequest {
  categoryId: Id;
  language: Language;
  headline: string;
  summary: string;
  content: ArticleContent;
  youtubeUrl?: string | null;
  tags?: string[];
  priority?: ArticlePriority;
  status?: CreatableArticleStatus;
  featuredImageId?: Id | null;
  ogImageId?: Id | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
}

export type UpdateArticleRequest = Partial<
  Omit<CreateArticleRequest, 'status'>
> & {
  status?: ArticleStatus;
};

export interface ArticleStatusCountsDto {
  all: number;
  draft: number;
  published: number;
  archived: number;
}

export interface ArticleListParams {
  page?: number;
  limit?: number;
  categoryId?: Id;
  language?: Language;
  status?: ArticleStatus;
  priority?: ArticlePriority;
  search?: string;
  sort?: 'newest' | 'oldest';
}
