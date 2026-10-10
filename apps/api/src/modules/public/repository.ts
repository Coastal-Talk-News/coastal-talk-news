import type {
  ArticlePriority,
  Language,
  TransactionClient,
} from '@coastal-talk-news/db';
import { activeWindowWhere } from '../../lib/schedule.js';
import { liveArticleWhere } from '../../lib/article-visibility.js';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

// Exported: the categories module reuses this exact shape for its own
// "published articles in this category" query, so a public article card
// looks identical whichever route it came from.
export const cardSelect = {
  id: true,
  slug: true,
  headline: true,
  summary: true,
  language: true,
  publicationDate: true,
  category: { select: { id: true, slug: true, name: true, nameKannada: true } },
  media: mediaSelect,
} as const;

const detailSelect = {
  ...cardSelect,
  content: true,
  featuredImageLayout: true,
  youtubeUrl: true,
  tags: true,
  seoTitle: true,
  metaDescription: true,
  ogImage: mediaSelect,
  updatedAt: true,
} as const;

export type ArticleCardRow = Awaited<
  ReturnType<typeof findRecentForCategories>
>[number];
export type NavCategoryRow = Awaited<
  ReturnType<typeof findNavCategories>
>[number];

const newestFirst: Array<{ publicationDate?: 'desc'; createdAt?: 'desc' }> = [
  { publicationDate: 'desc' },
  { createdAt: 'desc' },
];

/** Unpublished articles are absent, not forbidden: a stale link should 404, not 403. */
/** By id or by current slug: either is a single indexed lookup. */
export function findPublishedArticle(
  db: TransactionClient,
  key: { id: string } | { slug: string },
) {
  return db.article.findFirst({
    where: { ...liveArticleWhere(), ...key },
    select: detailSelect,
  });
}

/** The article an old slug belonged to, if any. */
export async function findArticleIdBySlugRedirect(
  db: TransactionClient,
  slug: string,
): Promise<string | null> {
  const redirect = await db.articleSlugRedirect.findUnique({
    where: { slug },
    select: { articleId: true },
  });
  return redirect?.articleId ?? null;
}

/** Just enough for sitemap.xml: every published article's address and last edit. */
export function findSitemapArticles(db: TransactionClient) {
  return db.article.findMany({
    where: liveArticleWhere(),
    orderBy: newestFirst,
    select: { id: true, slug: true, updatedAt: true },
  });
}

/** Hidden categories have no public page, so they stay out of the sitemap. */
export function findSitemapCategories(db: TransactionClient) {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, updatedAt: true },
  });
}

/**
 * Only a published article can be read, so a draft's id learns nothing: the
 * running total and the dated log row are written together, and only when
 * the article actually exists and is published.
 */
export async function recordArticleView(
  db: TransactionClient,
  id: string,
): Promise<void> {
  // Raw SQL rather than an update through Prisma, which would also bump
  // updated_at: that column is the article's dateModified for search
  // engines and the CMS's "recently edited" order, and a reader isn't an edit.
  const updated = await db.$executeRaw`
    UPDATE articles SET view_count = view_count + 1
    WHERE id = ${id} AND status = 'PUBLISHED'::"ArticleStatus"
  `;
  if (updated > 0) {
    await db.articleView.create({ data: { articleId: id } });
  }
}

export type ArticleDetailRow = NonNullable<
  Awaited<ReturnType<typeof findPublishedArticle>>
>;

export function findSettings(db: TransactionClient) {
  return db.siteSettings.findFirst({
    select: {
      siteName: true,
      tagline: true,
      contactEmail: true,
      contactPhone: true,
      contactAddress: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      xUrl: true,
      whatsappEnglishUrl: true,
      whatsappKannadaUrl: true,
      defaultUiLanguage: true,
      defaultSeoTitle: true,
      defaultMetaDescription: true,
      articleCacheMinutes: true,
      googleSiteVerification: true,
      logo: mediaSelect,
      favicon: mediaSelect,
      defaultOgImage: mediaSelect,
    },
  });
}

/**
 * Only the standalone pages' own copy. Separate from findSettings because
 * that one backs /site, which every page on the reader site fetches — the
 * two documents here would ride along on all of them for nothing.
 */
export function findPageSettings(db: TransactionClient) {
  return db.siteSettings.findFirst({
    select: {
      aboutTitle: true,
      aboutIntro: true,
      aboutContent: true,
      aboutContentKannada: true,
      contactTitle: true,
      contactIntro: true,
      contactHours: true,
      advertiseTitle: true,
      advertiseIntro: true,
      advertiseContent: true,
      privacyContent: true,
      termsContent: true,
      contactEmail: true,
      contactPhone: true,
      contactAddress: true,
    },
  });
}

/**
 * `language` only narrows the published-article count each category carries
 * (used by the homepage to decide which categories have content in the
 * active language) — it never hides a category from navigation itself, since
 * nav availability isn't tied to any one article language.
 */
export function findNavCategories(
  db: TransactionClient,
  { language }: { language?: Language } = {},
) {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      nameKannada: true,
      description: true,
      parentId: true,
      media: mediaSelect,
      _count: {
        select: {
          articles: {
            where: { ...liveArticleWhere(), ...(language && { language }) },
          },
        },
      },
    },
  });
}

export function findActiveBreakingNews(db: TransactionClient, now: Date) {
  return db.breakingNews.findMany({
    where: {
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
    orderBy: { startAt: 'desc' },
    select: {
      id: true,
      headline: true,
      headlineKannada: true,
      articleUrl: true,
      articleUrlKannada: true,
    },
    take: 10,
  });
}

// Carried by every page render, so it stays at what a banner draws: no
// description document, no detail image, no advertiser URL. Each banner links
// to the ad's own page, which loads those itself.
const adCardSelect = {
  id: true,
  advertiserName: true,
  placement: true,
  fitMode: true,
  zoom: true,
  offsetX: true,
  offsetY: true,
  media: mediaSelect,
} as const;

// The CMS reorder call assigns every ad in a placement a distinct position,
// so a tie only happens for a row nobody has dragged yet — startAt desc is
// just the fallback for that case, not the primary sort.
export function findActiveAdvertisements(db: TransactionClient, now: Date) {
  return db.advertisement.findMany({
    where: activeWindowWhere(now),
    orderBy: [{ displayOrder: 'asc' }, { startAt: 'desc' }],
    select: adCardSelect,
  });
}

/** Absent rather than forbidden once the run is over, so a stale link 404s. */
export function findActiveAdvertisement(
  db: TransactionClient,
  id: string,
  now: Date,
) {
  return db.advertisement.findFirst({
    where: { id, ...activeWindowWhere(now) },
    select: {
      ...adCardSelect,
      destinationUrl: true,
      description: true,
      descriptionKannada: true,
      descriptionText: true,
      descriptionTextKannada: true,
      detailMedia: mediaSelect,
    },
  });
}

export type AdvertisementDetailRow = NonNullable<
  Awaited<ReturnType<typeof findActiveAdvertisement>>
>;

/**
 * One query for every category section rather than one per category: fetch a
 * window of recent articles and group them in memory.
 */
export function findRecentForCategories(
  db: TransactionClient,
  categoryIds: string[],
  take: number,
  { language }: { language?: Language } = {},
) {
  return db.article.findMany({
    where: {
      ...liveArticleWhere(),
      categoryId: { in: categoryIds },
      ...(language && { language }),
    },
    orderBy: newestFirst,
    select: cardSelect,
    take,
  });
}

export function findRecentByPriority(
  db: TransactionClient,
  priority: ArticlePriority,
  take: number,
  { language }: { language?: Language } = {},
) {
  return db.article.findMany({
    where: {
      ...liveArticleWhere(),
      priority,
      ...(language && { language }),
    },
    orderBy: newestFirst,
    select: cardSelect,
    take,
  });
}

export function findPublishedSince(
  db: TransactionClient,
  since: Date,
  take: number,
  { language }: { language?: Language } = {},
) {
  return db.article.findMany({
    where: {
      ...liveArticleWhere(),
      publicationDate: { gte: since },
      ...(language && { language }),
    },
    orderBy: newestFirst,
    select: cardSelect,
    take,
  });
}

export function findRecentPublished(
  db: TransactionClient,
  excludeId: string | undefined,
  { language }: { language?: Language },
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: {
      ...liveArticleWhere(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(language && { language }),
    },
    orderBy: newestFirst,
    select: cardSelect,
    ...page,
  });
}

export function countRecentPublished(
  db: TransactionClient,
  excludeId: string | undefined,
  { language }: { language?: Language },
) {
  return db.article.count({
    where: {
      ...liveArticleWhere(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(language && { language }),
    },
  });
}

export function findPublishedByPriority(
  db: TransactionClient,
  priority: ArticlePriority,
  { language }: { language?: Language },
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: { ...liveArticleWhere(), priority, ...(language && { language }) },
    orderBy: newestFirst,
    select: cardSelect,
    ...page,
  });
}

export function countPublishedByPriority(
  db: TransactionClient,
  priority: ArticlePriority,
  { language }: { language?: Language } = {},
) {
  return db.article.count({
    where: { ...liveArticleWhere(), priority, ...(language && { language }) },
  });
}
