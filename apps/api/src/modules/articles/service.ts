import type {
  ArticlePriority,
  ArticleStatus,
  Database,
  Language,
} from '@coastal-talk-news/db';
import type { ImageLayoutDto } from '@coastal-talk-news/types';
import type { FastifyBaseLogger } from 'fastify';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import {
  assertArticleSlugAvailable,
  uniqueArticleSlug,
} from '../../lib/slugs.js';
import {
  normalizeSlugInput,
  suggestArticleSlug,
} from '@coastal-talk-news/validation/slug';
import { extractPlainText } from '../../lib/tiptap-text.js';
import {
  revalidateArticle,
  type WebRevalidateConfig,
} from '../../lib/webRevalidate.js';
import { releaseMedia, syncArticleMedia } from '../media/reference.js';
import {
  hydrateContent,
  prepareContent,
  toStoredLayout,
} from '../media/rich-text.js';
import { purgeStorageObjects } from '../media/service.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';
import type { ListFilters } from './repository.js';

export interface ArticleServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
  webRevalidate: WebRevalidateConfig;
}

export interface CreateArticleInput {
  categoryId: string;
  language: Language;
  headline: string;
  summary: string;
  content: object;
  youtubeUrl?: string | null;
  tags?: string[];
  priority?: ArticlePriority;
  status?: Exclude<ArticleStatus, 'ARCHIVED'>;
  featuredImageId?: string | null;
  featuredImageLayout?: ImageLayoutDto;
  ogImageId?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  slug?: string;
  endAt?: string | null;
}

export type UpdateArticleInput = Partial<Omit<CreateArticleInput, 'status'>> & {
  status?: ArticleStatus;
};

async function assertCategoryAssignable(
  db: Database,
  categoryId: string,
): Promise<void> {
  const category = await repository.findCategoryForAssignment(db, categoryId);
  if (!category) {
    throw new BadRequestError(
      'categoryId does not refer to an existing category.',
    );
  }
  if (category._count.children > 0) {
    throw new BadRequestError(
      'This category groups subcategories and cannot have articles assigned directly. Choose one of its subcategories instead.',
    );
  }
}

async function assertMediaExists(
  db: Database,
  mediaId: string,
  field: string,
): Promise<void> {
  if (!(await repository.mediaExists(db, mediaId))) {
    throw new BadRequestError(
      `${field} does not refer to an existing media asset.`,
    );
  }
}

export async function listForCms(
  { db }: ArticleServiceDeps,
  filters: ListFilters,
  pagination: PaginationParams,
) {
  return repository.list(db, filters, toSkipTake(pagination));
}

export async function getStatusCounts(
  { db }: ArticleServiceDeps,
  filters: Omit<ListFilters, 'status'>,
) {
  const counts = { all: 0, draft: 0, published: 0, archived: 0 };
  for (const { status, count } of await repository.countByStatus(db, filters)) {
    counts.all += count;
    if (status === 'DRAFT') counts.draft = count;
    else if (status === 'PUBLISHED') counts.published = count;
    else if (status === 'ARCHIVED') counts.archived = count;
  }
  return counts;
}

/** The editor needs each picture's URL, which the stored document leaves out. */
async function forEditor<T extends { content: unknown }>(
  { db, storage }: ArticleServiceDeps,
  article: T,
): Promise<T> {
  return {
    ...article,
    content: await hydrateContent(db, storage, article.content, 'editor'),
  };
}

/**
 * The frame belongs to one picture, so it is dropped when the picture is
 * removed or swapped, and otherwise only changes when the editor sent one.
 */
function resolveLayout(
  input: UpdateArticleInput,
  existing: { mediaId: string | null },
) {
  const replaced =
    input.featuredImageId !== undefined &&
    input.featuredImageId !== existing.mediaId;
  if (
    input.featuredImageId === null ||
    (replaced && !input.featuredImageLayout)
  ) {
    return {};
  }
  return input.featuredImageLayout
    ? toStoredLayout(input.featuredImageLayout)
    : undefined;
}

export async function getForCms(deps: ArticleServiceDeps, id: string) {
  const article = await repository.findById(deps.db, id);
  if (!article) {
    throw new NotFoundError('Article');
  }
  return forEditor(deps, article);
}

/**
 * A slug from the headline (in its own language) or, failing that, the SEO
 * title, made unique; null only when neither has a letter or digit in it.
 */
async function generatedSlug(
  db: Database,
  source: { headline: string; seoTitle?: string | null },
  exceptId?: string,
): Promise<string | null> {
  const base = suggestArticleSlug(source);
  return base ? uniqueArticleSlug(db, base, exceptId) : null;
}

/**
 * An end must still be ahead when it is set: scheduling a moment that has
 * passed would silently take the article off the site. Only a changed end is
 * checked, so editing an article whose end has since passed is not blocked.
 */
function assertEndInFuture(endAt: Date | null, existing: Date | null) {
  if (!endAt || endAt.getTime() === existing?.getTime()) return;
  if (endAt.getTime() <= Date.now()) {
    throw new BadRequestError('The end date and time must be in the future.');
  }
}

/** Going live needs an address. */
function assertPublishable(slug: string | null) {
  if (!slug) {
    throw new BadRequestError(
      'Add a URL slug before publishing — the headline has no words to make one from.',
    );
  }
}

/**
 * The unique index is the last word on a clash: another save can take the
 * slug between the check and the write.
 */
async function withSlugGuard<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if ((error as { code?: unknown }).code === 'P2002') {
      throw new ConflictError(
        'Another article took this URL slug a moment ago. Choose a different one.',
        { field: 'slug' },
      );
    }
    throw error;
  }
}

export async function create(
  deps: ArticleServiceDeps,
  input: CreateArticleInput,
) {
  const { db } = deps;
  await assertCategoryAssignable(db, input.categoryId);
  if (input.featuredImageId) {
    await assertMediaExists(db, input.featuredImageId, 'featuredImageId');
  }
  if (input.ogImageId) {
    await assertMediaExists(db, input.ogImageId, 'ogImageId');
  }

  const status = input.status ?? 'DRAFT';
  const endAt = input.endAt ? new Date(input.endAt) : null;
  assertEndInFuture(endAt, null);
  const slug = input.slug
    ? await assertArticleSlugAvailable(db, normalizeSlugInput(input.slug))
    : await generatedSlug(db, input);
  if (status === 'PUBLISHED') assertPublishable(slug);
  const { content, mediaIds } = await prepareContent(db, input.content);

  // One write: the article and its picture links land together or not at all.
  const article = await withSlugGuard(() =>
    repository.create(db, {
      categoryId: input.categoryId,
      language: input.language,
      headline: input.headline.trim(),
      summary: input.summary.trim(),
      content,
      contentText: extractPlainText(content),
      youtubeUrl: input.youtubeUrl?.trim() || null,
      tags: input.tags ?? [],
      priority: input.priority ?? 'NORMAL',
      status,
      // Stamped once, on the first publish.
      publicationDate: status === 'PUBLISHED' ? new Date() : null,
      endAt,
      mediaId: input.featuredImageId ?? null,
      featuredImageLayout:
        input.featuredImageId && input.featuredImageLayout
          ? toStoredLayout(input.featuredImageLayout)
          : {},
      ogImageId: input.ogImageId ?? null,
      seoTitle: input.seoTitle?.trim() || null,
      metaDescription: input.metaDescription?.trim() || null,
      slug,
      imageIds: mediaIds,
    }),
  );

  await revalidateArticle(
    deps.webRevalidate,
    deps.logger,
    article.id,
    article.slug,
  );
  return forEditor(deps, article);
}

export async function update(
  deps: ArticleServiceDeps,
  id: string,
  input: UpdateArticleInput,
) {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Article');
  }

  if (input.categoryId) {
    await assertCategoryAssignable(db, input.categoryId);
  }
  if (input.featuredImageId) {
    await assertMediaExists(db, input.featuredImageId, 'featuredImageId');
  }
  if (input.ogImageId) {
    await assertMediaExists(db, input.ogImageId, 'ogImageId');
  }

  const mediaChanged =
    input.featuredImageId !== undefined &&
    input.featuredImageId !== existing.mediaId;
  const ogImageChanged =
    input.ogImageId !== undefined && input.ogImageId !== existing.ogImageId;

  const willBePublished =
    input.status === 'PUBLISHED' ||
    (input.status === undefined && existing.status === 'PUBLISHED');
  const publicationDate =
    willBePublished && !existing.publicationDate ? new Date() : undefined;

  // A headline edit never touches an existing slug: links already shared
  // must keep working. Only a slug the editor sends changes it; an article
  // without one yet gets one as soon as its headline or title allows.
  const slug =
    input.slug !== undefined
      ? await assertArticleSlugAvailable(db, normalizeSlugInput(input.slug), id)
      : existing.slug === null
        ? await generatedSlug(
            db,
            {
              headline: input.headline ?? existing.headline,
              seoTitle:
                input.seoTitle !== undefined
                  ? input.seoTitle
                  : existing.seoTitle,
            },
            id,
          )
        : undefined;
  if (willBePublished) assertPublishable(slug ?? existing.slug);
  const endAt =
    input.endAt === undefined
      ? undefined
      : input.endAt
        ? new Date(input.endAt)
        : null;
  if (endAt !== undefined) assertEndInFuture(endAt, existing.endAt);
  // Only an address readers could have seen needs to keep working.
  const movedFrom =
    slug && existing.slug && slug !== existing.slug && existing.publicationDate
      ? existing.slug
      : null;

  const body =
    input.content !== undefined
      ? await prepareContent(db, input.content)
      : undefined;
  const featuredImageLayout = resolveLayout(input, existing);

  const { article, orphanedKeys } = await withSlugGuard(() =>
    db.$transaction(async (tx) => {
      const article = await repository.update(tx, id, {
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId }
          : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.headline !== undefined
          ? { headline: input.headline.trim() }
          : {}),
        ...(input.summary !== undefined
          ? { summary: input.summary.trim() }
          : {}),
        ...(body
          ? {
              content: body.content,
              contentText: extractPlainText(body.content),
            }
          : {}),
        ...(featuredImageLayout !== undefined ? { featuredImageLayout } : {}),
        ...(input.youtubeUrl !== undefined
          ? { youtubeUrl: input.youtubeUrl?.trim() || null }
          : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(publicationDate !== undefined ? { publicationDate } : {}),
        ...(input.featuredImageId !== undefined
          ? { mediaId: input.featuredImageId }
          : {}),
        ...(input.ogImageId !== undefined
          ? { ogImageId: input.ogImageId }
          : {}),
        ...(input.seoTitle !== undefined
          ? { seoTitle: input.seoTitle?.trim() || null }
          : {}),
        ...(input.metaDescription !== undefined
          ? { metaDescription: input.metaDescription?.trim() || null }
          : {}),
        ...(slug ? { slug } : {}),
        ...(endAt !== undefined ? { endAt } : {}),
      });
      if (movedFrom && slug) {
        await repository.recordSlugChange(tx, id, movedFrom, slug);
      }

      const orphanedKeys: string[] = [];
      if (body) {
        const dropped = await syncArticleMedia(tx, id, body.mediaIds);
        orphanedKeys.push(...(await releaseMedia(tx, dropped)));
      }
      if (mediaChanged) {
        orphanedKeys.push(...(await releaseMedia(tx, [existing.mediaId])));
      }
      if (ogImageChanged) {
        orphanedKeys.push(...(await releaseMedia(tx, [existing.ogImageId])));
      }

      return { article, orphanedKeys };
    }),
  );

  await purgeStorageObjects(storage, logger, orphanedKeys);
  await revalidateArticle(
    deps.webRevalidate,
    deps.logger,
    article.id,
    article.slug,
  );
  // A changed slug leaves a stale cache entry under the old one too.
  if (existing.slug && existing.slug !== article.slug) {
    await revalidateArticle(
      deps.webRevalidate,
      deps.logger,
      article.id,
      existing.slug,
    );
  }
  return forEditor(deps, article);
}

export async function remove(
  deps: ArticleServiceDeps,
  id: string,
): Promise<void> {
  const { db, storage, logger } = deps;

  const existing = await repository.findById(db, id);
  if (!existing) {
    throw new NotFoundError('Article');
  }

  const orphanedKeys = await db.$transaction(async (tx) => {
    const inBody = await tx.articleMedia.findMany({
      where: { articleId: id },
      select: { mediaId: true },
    });
    await repository.remove(tx, id);
    return releaseMedia(tx, [
      existing.mediaId,
      existing.ogImageId,
      ...inBody.map((row) => row.mediaId),
    ]);
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  await revalidateArticle(deps.webRevalidate, deps.logger, id, existing.slug);
}
