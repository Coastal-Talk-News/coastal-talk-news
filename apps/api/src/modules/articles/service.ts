import type { Database } from '@coastal-talk-news/db';
import type { FastifyBaseLogger } from 'fastify';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import { extractPlainText } from '../../lib/tiptap-text.js';
import { releaseMedia } from '../media/reference.js';
import { purgeStorageObjects } from '../media/service.js';
import type { ObjectStorage } from '../media/storage.js';
import * as repository from './repository.js';
import type { ListFilters } from './repository.js';

export interface ArticleServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
}

export interface CreateArticleInput {
  categoryId: string;
  language: 'ENGLISH' | 'KANNADA';
  headline: string;
  summary: string;
  content: object;
  youtubeUrl?: string | null;
  tags?: string[];
  priority?: 'LEAD_STORY' | 'FEATURED' | 'NORMAL';
  // No Scheduled status in V1 — omit or DRAFT/PUBLISHED only.
  status?: 'DRAFT' | 'PUBLISHED';
  featuredImageId?: string | null;
  ogImageId?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
}

/** Editing allows the full status range, since Archive is reached via update. */
export type UpdateArticleInput = Partial<Omit<CreateArticleInput, 'status'>> & {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

async function assertCategoryExists(
  db: Database,
  categoryId: string,
): Promise<void> {
  if (!(await repository.categoryExists(db, categoryId))) {
    throw new BadRequestError(
      'categoryId does not refer to an existing category.',
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
  const [rows, total] = await Promise.all([
    repository.findMany(db, filters, toSkipTake(pagination)),
    repository.count(db, filters),
  ]);
  return { rows, total };
}

export async function getStatusCounts(
  { db }: ArticleServiceDeps,
  filters: Omit<ListFilters, 'status'>,
) {
  const grouped = await repository.countByStatus(db, filters);
  const counts = { all: 0, draft: 0, published: 0, archived: 0 };
  for (const row of grouped) {
    const n = row._count._all;
    counts.all += n;
    if (row.status === 'DRAFT') counts.draft = n;
    else if (row.status === 'PUBLISHED') counts.published = n;
    else if (row.status === 'ARCHIVED') counts.archived = n;
  }
  return counts;
}

export async function getForCms({ db }: ArticleServiceDeps, id: string) {
  const article = await repository.findById(db, id);
  if (!article) {
    throw new NotFoundError('Article');
  }
  return article;
}

export async function create(
  { db }: ArticleServiceDeps,
  input: CreateArticleInput,
) {
  await assertCategoryExists(db, input.categoryId);
  if (input.featuredImageId) {
    await assertMediaExists(db, input.featuredImageId, 'featuredImageId');
  }
  if (input.ogImageId) {
    await assertMediaExists(db, input.ogImageId, 'ogImageId');
  }

  const status = input.status ?? 'DRAFT';

  return repository.create(db, {
    categoryId: input.categoryId,
    language: input.language,
    headline: input.headline.trim(),
    summary: input.summary.trim(),
    content: input.content,
    contentText: extractPlainText(input.content),
    youtubeUrl: input.youtubeUrl?.trim() || null,
    tags: input.tags ?? [],
    priority: input.priority ?? 'NORMAL',
    status,
    // "Publishing sets status = PUBLISHED and publication_date = now() in
    // the same action" (docs/DATA-MODEL.md) — null until first published.
    publicationDate: status === 'PUBLISHED' ? new Date() : null,
    mediaId: input.featuredImageId ?? null,
    ogImageId: input.ogImageId ?? null,
    seoTitle: input.seoTitle?.trim() || null,
    metaDescription: input.metaDescription?.trim() || null,
  });
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
    await assertCategoryExists(db, input.categoryId);
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

  // Re-publishing an already-published article, or moving it to Draft/
  // Archived, leaves the original publish date alone as history — only the
  // first transition into PUBLISHED stamps it.
  const willBePublished =
    input.status === 'PUBLISHED' ||
    (input.status === undefined && existing.status === 'PUBLISHED');
  const publicationDate =
    willBePublished && !existing.publicationDate ? new Date() : undefined;

  const { article, orphanedKeys } = await db.$transaction(async (tx) => {
    const article = await repository.update(tx, id, {
      ...(input.categoryId !== undefined
        ? { categoryId: input.categoryId }
        : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.headline !== undefined
        ? { headline: input.headline.trim() }
        : {}),
      ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
      ...(input.content !== undefined
        ? {
            content: input.content,
            contentText: extractPlainText(input.content),
          }
        : {}),
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
      ...(input.ogImageId !== undefined ? { ogImageId: input.ogImageId } : {}),
      ...(input.seoTitle !== undefined
        ? { seoTitle: input.seoTitle?.trim() || null }
        : {}),
      ...(input.metaDescription !== undefined
        ? { metaDescription: input.metaDescription?.trim() || null }
        : {}),
    });

    const orphanedKeys: string[] = [];
    if (mediaChanged) {
      orphanedKeys.push(...(await releaseMedia(tx, [existing.mediaId])));
    }
    if (ogImageChanged) {
      orphanedKeys.push(...(await releaseMedia(tx, [existing.ogImageId])));
    }

    return { article, orphanedKeys };
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
  return article;
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
    await repository.remove(tx, id);
    return releaseMedia(tx, [existing.mediaId, existing.ogImageId]);
  });

  await purgeStorageObjects(storage, logger, orphanedKeys);
}
