import type { TransactionClient } from '@coastal-talk-news/db';
import {
  ARTICLE_SLUG_MAX,
  SLUG_MAX,
  isValidArticleSlug,
  isValidSlug,
  slugify,
} from '@coastal-talk-news/validation/slug';
import { BadRequestError, ConflictError } from './errors.js';

async function isTaken(
  db: TransactionClient,
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const row = await db.category.findFirst({
    where: { slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  return row !== null;
}

/**
 * A category slug made from `name` that nothing else uses yet: the plain slug
 * if it's free, otherwise the first free "-2", "-3"… Generated slugs never
 * fail, so creating a category can't be blocked by a clash the editor never
 * chose.
 */
export async function generateUniqueSlug(
  db: TransactionClient,
  name: string,
  exceptId?: string,
): Promise<string> {
  const made = slugify(name);
  const base = isValidSlug(made) ? made : 'section';

  if (!(await isTaken(db, base, exceptId))) return base;
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/, '')}${suffix}`;
    if (!(await isTaken(db, candidate, exceptId))) return candidate;
  }
}

/**
 * A slug the editor typed. Unlike a generated one, a clash is reported rather
 * than silently renamed: the editor picked this address and should know it is
 * already another category's.
 */
export async function assertSlugAvailable(
  db: TransactionClient,
  slug: string,
  exceptId?: string,
): Promise<string> {
  if (!isValidSlug(slug)) {
    throw new BadRequestError(
      'The URL slug may only contain lowercase letters, numbers and single hyphens.',
    );
  }
  if (await isTaken(db, slug, exceptId)) {
    throw new ConflictError(
      `Another category already uses the URL slug "${slug}". Choose a different one.`,
      { field: 'slug' },
    );
  }
  return slug;
}

/**
 * Taken if another article uses it now, or used it before (an old slug keeps
 * redirecting to its own article, so it can't be handed to a new one). An
 * article may take back one of its own old slugs.
 */
async function isArticleSlugTaken(
  db: TransactionClient,
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const notSelf = exceptId ? { NOT: { id: exceptId } } : {};
  const notSelfRedirect = exceptId ? { NOT: { articleId: exceptId } } : {};
  const [article, redirect] = await Promise.all([
    db.article.findFirst({ where: { slug, ...notSelf }, select: { id: true } }),
    db.articleSlugRedirect.findFirst({
      where: { slug, ...notSelfRedirect },
      select: { slug: true },
    }),
  ]);
  return article !== null || redirect !== null;
}

/**
 * `base` (a slug from articleSlugify) if free, else the first free
 * "-2", "-3"… Only runs when an article is created or its slug is generated,
 * never on a page load.
 */
export async function uniqueArticleSlug(
  db: TransactionClient,
  base: string,
  exceptId?: string,
): Promise<string> {
  if (!(await isArticleSlugTaken(db, base, exceptId))) return base;
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, ARTICLE_SLUG_MAX - suffix.length).replace(/-+$/, '')}${suffix}`;
    if (!(await isArticleSlugTaken(db, candidate, exceptId))) return candidate;
  }
}

/** A slug the editor typed: a clash is reported, not silently renamed. */
export async function assertArticleSlugAvailable(
  db: TransactionClient,
  slug: string,
  exceptId?: string,
): Promise<string> {
  if (!isValidArticleSlug(slug)) {
    throw new BadRequestError(
      'The URL slug may only contain lowercase letters (English or Kannada), numbers and single hyphens.',
    );
  }
  if (await isArticleSlugTaken(db, slug, exceptId)) {
    throw new ConflictError(
      `Another article already uses the URL slug "${slug}". Choose a different one.`,
      { field: 'slug' },
    );
  }
  return slug;
}
