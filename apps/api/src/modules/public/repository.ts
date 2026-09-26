import type {
  ArticlePriority,
  Language,
  TransactionClient,
} from '@coastal-talk-news/db';
import { activeWindowWhere } from '../../lib/schedule.js';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

// Exported: the categories module reuses this exact shape for its own
// "published articles in this category" query, so a public article card
// looks identical whichever route it came from.
export const cardSelect = {
  id: true,
  headline: true,
  summary: true,
  language: true,
  publicationDate: true,
  category: { select: { id: true, name: true, nameKannada: true } },
  media: mediaSelect,
} as const;

const detailSelect = {
  ...cardSelect,
  content: true,
  youtubeUrl: true,
  seoTitle: true,
  metaDescription: true,
  ogImage: mediaSelect,
} as const;

export type ArticleCardRow = Awaited<
  ReturnType<typeof findRecentForCategories>
>[number];
export type NavCategoryRow = Awaited<
  ReturnType<typeof findNavCategories>
>[number];

const publishedWhere = { status: 'PUBLISHED' } as const;

const newestFirst: Array<{ publicationDate?: 'desc'; createdAt?: 'desc' }> = [
  { publicationDate: 'desc' },
  { createdAt: 'desc' },
];

/** Unpublished articles are absent, not forbidden: a stale link should 404, not 403. */
export function findPublishedArticle(db: TransactionClient, id: string) {
  return db.article.findFirst({
    where: { ...publishedWhere, id },
    select: detailSelect,
  });
}

/** Only a published article can be read, so a draft's id learns nothing. */
export function incrementViewCount(db: TransactionClient, id: string) {
  return db.article.updateMany({
    where: { ...publishedWhere, id },
    data: { viewCount: { increment: 1 } },
  });
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
      name: true,
      nameKannada: true,
      description: true,
      parentId: true,
      media: mediaSelect,
      _count: {
        select: {
          articles: {
            where: { ...publishedWhere, ...(language && { language }) },
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
      descriptionText: true,
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
      ...publishedWhere,
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
      ...publishedWhere,
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
      ...publishedWhere,
      publicationDate: { gte: since },
      ...(language && { language }),
    },
    orderBy: newestFirst,
    select: cardSelect,
    take,
  });
}

export function findPublishedByPriority(
  db: TransactionClient,
  priority: ArticlePriority,
  { language }: { language?: Language },
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: { ...publishedWhere, priority, ...(language && { language }) },
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
    where: { ...publishedWhere, priority, ...(language && { language }) },
  });
}
