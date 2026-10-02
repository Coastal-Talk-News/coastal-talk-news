import type { Id, IsoDateTime, RichTextContent } from './api.js';
import type { ArticleStatus } from './dashboard.js';
import type { ImageLayoutDto, MediaSummaryDto } from './media.js';

export type Language = 'ENGLISH' | 'KANNADA';
export type ArticlePriority = 'LEAD_STORY' | 'FEATURED' | 'NORMAL';

export type ArticleContent = RichTextContent;

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
  /** When set, the article leaves the public site at this time. */
  endAt: IsoDateTime | null;
  seoTitle: string | null;
  metaDescription: string | null;
  /** The public address is /article/<slug>, in the headline's language
   * (Kannada headlines give Kannada slugs). Null only on rows from before
   * slugs, until backfilled. */
  slug: string | null;
  featuredImage: MediaSummaryDto | null;
  featuredImageLayout: ImageLayoutDto;
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
  featuredImageLayout?: ImageLayoutDto;
  ogImageId?: Id | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  /** Optional scheduled end; null (or omitted) means no end. */
  endAt?: IsoDateTime | null;
  /** Omitted: made from the headline (or SEO title). Never regenerated
   * by a later headline edit; only a slug sent here changes it. */
  slug?: string;
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

/** The form as it stands, complete or not, to be shown as the reader page. */
export interface ArticlePreviewRequest {
  categoryId?: Id | null;
  language?: Language;
  headline?: string;
  summary?: string;
  content?: ArticleContent;
  youtubeUrl?: string | null;
  tags?: string[];
  featuredImageId?: Id | null;
  featuredImageLayout?: ImageLayoutDto;
}
