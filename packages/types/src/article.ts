import type { Id, IsoDateTime } from './api.js';
import type { ArticleStatus } from './dashboard.js';
import type { MediaSummaryDto } from './media.js';

export type Language = 'ENGLISH' | 'KANNADA';
export type ArticlePriority = 'LEAD_STORY' | 'FEATURED' | 'NORMAL';

/**
 * Tiptap document JSON. Only the top-level envelope is typed — the API
 * validates this same shape (packages/validation's ArticleContentSchema) and
 * otherwise treats it opaquely, so a full ProseMirror node union isn't worth
 * maintaining here.
 */
export interface ArticleContent {
  type: 'doc';
  content: unknown[];
}

export interface ArticleDto {
  id: Id;
  /**
   * Nullable at the DB level (a change applied directly to the shared dev DB
   * outside this schema) — the API still requires a category on create, so
   * this is only ever null for a row written outside that path.
   */
  categoryId: Id | null;
  categoryName: string | null;
  language: Language;
  headline: string;
  summary: string;
  content: ArticleContent;
  youtubeUrl: string | null;
  /** Free text, author-entered — no controlled taxonomy. */
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

/** No Scheduled status in V1 — creating an article publishes it immediately or saves a draft. */
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

/** Editing allows the full status range, since Archive is reached via update. */
export type UpdateArticleRequest = Partial<
  Omit<CreateArticleRequest, 'status'>
> & {
  status?: ArticleStatus;
};

/** Counts for the list page's status tabs — honors every list filter but status. */
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
  /** Matched against headline and content, case-insensitive. */
  search?: string;
  sort?: 'newest' | 'oldest';
}
