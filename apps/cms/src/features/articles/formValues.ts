import type {
  ArticleContent,
  ArticleDto,
  ArticlePriority,
  Language,
  MediaSummaryDto,
} from '@coastal-talk-news/types';

export interface FormValues {
  language: Language | '';
  categoryId: string;
  priority: ArticlePriority;
  headline: string;
  summary: string;
  content: ArticleContent | null;
  featuredImage: MediaSummaryDto | null;
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
    youtubeUrl: article.youtubeUrl ?? '',
    tags: article.tags,
    seoTitle: article.seoTitle ?? '',
    metaDescription: article.metaDescription ?? '',
    ogImage: article.ogImage,
  };
}
