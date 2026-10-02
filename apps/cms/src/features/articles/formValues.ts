import type {
  ArticleContent,
  ArticleDto,
  ArticlePreviewRequest,
  ArticlePriority,
  ImageLayoutDto,
  Language,
  MediaSummaryDto,
} from '@coastal-talk-news/types';
import { DEFAULT_LAYOUT } from '../media/imageFrame.js';

export interface FormValues {
  language: Language | '';
  categoryId: string;
  priority: ArticlePriority;
  headline: string;
  summary: string;
  content: ArticleContent | null;
  featuredImage: MediaSummaryDto | null;
  featuredImageLayout: ImageLayoutDto;
  youtubeUrl: string;
  tags: string[];
  seoTitle: string;
  metaDescription: string;
  ogImage: MediaSummaryDto | null;
}

export type UpdateValues = (patch: Partial<FormValues>) => void;

export function toValues(article: ArticleDto | null): FormValues {
  if (!article) {
    return {
      language: '',
      categoryId: '',
      priority: 'NORMAL',
      headline: '',
      summary: '',
      content: null,
      featuredImage: null,
      featuredImageLayout: DEFAULT_LAYOUT,
      youtubeUrl: '',
      tags: [],
      seoTitle: '',
      metaDescription: '',
      ogImage: null,
    };
  }
  return {
    language: article.language,
    categoryId: article.categoryId ?? '',
    priority: article.priority,
    headline: article.headline,
    summary: article.summary,
    content: article.content,
    featuredImage: article.featuredImage,
    featuredImageLayout: article.featuredImageLayout,
    youtubeUrl: article.youtubeUrl ?? '',
    tags: article.tags,
    seoTitle: article.seoTitle ?? '',
    metaDescription: article.metaDescription ?? '',
    ogImage: article.ogImage,
  };
}

/** The form as it stands, unfinished parts and all, for the reader-page preview. */
export function toPreviewRequest(values: FormValues): ArticlePreviewRequest {
  return {
    categoryId: values.categoryId || null,
    ...(values.language ? { language: values.language } : {}),
    headline: values.headline,
    summary: values.summary,
    ...(values.content ? { content: values.content } : {}),
    youtubeUrl: values.youtubeUrl.trim() || null,
    tags: values.tags,
    featuredImageId: values.featuredImage?.id ?? null,
    featuredImageLayout: values.featuredImageLayout,
  };
}
