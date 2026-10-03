import type { Database, Language } from '@coastal-talk-news/db';
import type {
  ArticleContent,
  ImageLayoutDto,
  PublicArticleDto,
} from '@coastal-talk-news/types';
import { prepareContent, toStoredLayout } from '../media/rich-text.js';
import type { ObjectStorage } from '../media/storage.js';
import type { ArticleDetailSource } from '../public/mapper.js';
import { presentArticle } from '../public/service.js';

export interface ArticlePreviewInput {
  categoryId?: string | null;
  language?: Language;
  headline?: string;
  summary?: string;
  content?: ArticleContent;
  youtubeUrl?: string | null;
  tags?: string[];
  featuredImageId?: string | null;
  featuredImageLayout?: ImageLayoutDto;
}

export interface ArticlePreviewDeps {
  db: Database;
  storage: ObjectStorage;
}

const EMPTY_DOCUMENT = { type: 'doc', content: [] };

/**
 * A draft, as it stands in the form, made into the page a reader would get.
 * Nothing is saved: the content goes through the same clean-up a save would
 * (so a bad document is refused here too) and then the same presenter the
 * published page uses. Unset fields get stand-ins so an unfinished article
 * can still be looked at.
 */
export async function buildPreview(
  { db, storage }: ArticlePreviewDeps,
  input: ArticlePreviewInput,
): Promise<PublicArticleDto> {
  const [category, media, prepared] = await Promise.all([
    input.categoryId
      ? db.category.findUnique({
          where: { id: input.categoryId },
          select: { id: true, slug: true, name: true, nameKannada: true },
        })
      : null,
    input.featuredImageId
      ? db.mediaAsset.findUnique({
          where: { id: input.featuredImageId },
          select: { id: true, storageKey: true, width: true, height: true },
        })
      : null,
    prepareContent(db, input.content ?? EMPTY_DOCUMENT),
  ]);

  const source: ArticleDetailSource = {
    id: 'preview',
    slug: null,
    updatedAt: new Date(),
    headline: input.headline?.trim() || 'Untitled article',
    summary: input.summary?.trim() ?? '',
    language: input.language ?? 'ENGLISH',
    publicationDate: new Date(),
    category,
    media,
    content: prepared.content,
    featuredImageLayout: input.featuredImageLayout
      ? toStoredLayout(input.featuredImageLayout)
      : {},
    youtubeUrl: input.youtubeUrl?.trim() || null,
    tags: input.tags ?? [],
    seoTitle: null,
    metaDescription: null,
    ogImage: null,
  };

  return presentArticle(
    { db, storage, toPublicUrl: (key) => storage.publicUrl(key) },
    source,
  );
}
