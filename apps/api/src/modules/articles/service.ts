import type {
  ArticlePriority,
  ArticleStatus,
  Database,
  Language,
} from '@coastal-talk-news/db';
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
  language: Language;
  headline: string;
  summary: string;
  content: object;
  youtubeUrl?: string | null;
  tags?: string[];
  priority?: ArticlePriority;
  status?: Exclude<ArticleStatus, 'ARCHIVED'>;
  featuredImageId?: string | null;
  ogImageId?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
}

export type UpdateArticleInput = Partial<Omit<CreateArticleInput, 'status'>> & {
  status?: ArticleStatus;
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
    // Stamped once, on the first publish.
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
