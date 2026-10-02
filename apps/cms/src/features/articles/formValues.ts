import type {
  ArticleContent,
  ArticleDto,
  ArticlePreviewRequest,
  ArticlePriority,
  ImageLayoutDto,
  Language,
  MediaSummaryDto,
} from '@coastal-talk-news/types';
import { splitIso } from '../../lib/dateTime.js';
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
  /** Empty on a new article: the API makes one from the headline. */
  slug: string;
  ogImage: MediaSummaryDto | null;
  /** The optional scheduled end, as the date-time field edits it; both
   * empty means no end. */
  endDate: string;
  endTime: string;
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
      slug: '',
      ogImage: null,
      endDate: '',
      endTime: '',
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
    slug: article.slug ?? '',
    ogImage: article.ogImage,
    endDate: article.endAt ? splitIso(article.endAt).date : '',
    endTime: article.endAt ? splitIso(article.endAt).time : '',
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
