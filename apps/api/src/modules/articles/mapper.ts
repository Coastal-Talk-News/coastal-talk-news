import type {
  ArticlePriority,
  ArticleStatus,
  Language,
} from '@coastal-talk-news/db';
import type { ArticleContent, ArticleDto } from '@coastal-talk-news/types';

interface MediaRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

export interface ArticleEntity {
  id: string;
  // Nullable at the DB level (see schema.prisma) — the API still requires a
  // category on create, so this is only ever null for a row written outside
  // that path.
  categoryId: string | null;
  language: Language;
  headline: string;
  summary: string;
  content: unknown;
  youtubeUrl: string | null;
  tags: string[];
  priority: ArticlePriority;
  status: ArticleStatus;
  publicationDate: Date | null;
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
  media: MediaRow | null;
  ogImage: MediaRow | null;
}

export type ToPublicUrl = (storageKey: string) => string;

function toMediaSummary(media: MediaRow | null, toPublicUrl: ToPublicUrl) {
  return media
    ? {
        id: media.id,
        url: toPublicUrl(media.storageKey),
        width: media.width,
        height: media.height,
      }
    : null;
}

export function toArticleDto(
  article: ArticleEntity,
  toPublicUrl: ToPublicUrl,
): ArticleDto {
  return {
    id: article.id,
    categoryId: article.categoryId,
    categoryName: article.category?.name ?? null,
    language: article.language,
    headline: article.headline,
    summary: article.summary,
    // Prisma's Json column is genuinely `unknown` to TypeScript; the actual
    // shape is enforced on write by ArticleContentSchema.
    content: article.content as ArticleContent,
    youtubeUrl: article.youtubeUrl,
    tags: article.tags,
    priority: article.priority,
    status: article.status,
    publicationDate: article.publicationDate?.toISOString() ?? null,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    featuredImage: toMediaSummary(article.media, toPublicUrl),
    ogImage: toMediaSummary(article.ogImage, toPublicUrl),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}
