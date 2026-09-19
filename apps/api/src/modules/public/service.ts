import type { Database, Language } from '@coastal-talk-news/db';
import type {
  PublicAdvertisementDetailDto,
  PublicArticleDto,
  PublicHomeDto,
  PublicPageDto,
  PublicSiteDto,
} from '@coastal-talk-news/types';
import { NotFoundError } from '../../lib/errors.js';
import * as articlesRepository from '../articles/repository.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import {
  toAdvertisement,
  toAdvertisementDetail,
  toArticleCard,
  toArticleDetail,
  toNavCategory,
  toPageContent,
  toSettings,
  withNavChildren,
  type ToPublicUrl,
} from './mapper.js';
import * as repository from './repository.js';

export interface PublicServiceDeps {
  db: Database;
  toPublicUrl: ToPublicUrl;
}

const CATEGORY_PREVIEW_ARTICLES = 4;
const HOME_LEAD_STORIES = 5;
const HOME_FEATURED = 6;
const HOME_TOP_STORIES = 6;

// A rolling window, not a calendar day, to sidestep picking a timezone.
const TOP_STORIES_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function getArticle(
  { db, toPublicUrl }: PublicServiceDeps,
  id: string,
): Promise<PublicArticleDto> {
  const article = await repository.findPublishedArticle(db, id);
  if (!article) {
    throw new NotFoundError('Article');
  }
  return toArticleDetail(article, toPublicUrl);
}

export async function getAdvertisement(
  { db, toPublicUrl }: PublicServiceDeps,
  id: string,
): Promise<PublicAdvertisementDetailDto> {
  const advertisement = await repository.findActiveAdvertisement(
    db,
    id,
    new Date(),
  );
  if (!advertisement) {
    throw new NotFoundError('Advertisement');
  }
  return toAdvertisementDetail(advertisement, toPublicUrl);
}

export async function getSite({
  db,
  toPublicUrl,
}: PublicServiceDeps): Promise<PublicSiteDto> {
  const now = new Date();
  const [settings, categories, breakingNews, advertisements] =
    await Promise.all([
      repository.findSettings(db),
      repository.findNavCategories(db),
      repository.findActiveBreakingNews(db, now),
      repository.findActiveAdvertisements(db, now),
    ]);

  if (!settings) {
    throw new NotFoundError('Site settings');
  }

  return {
    settings: toSettings(settings, toPublicUrl),
    categories: withNavChildren(
      categories.map((category) => toNavCategory(category, toPublicUrl)),
    ),
    breakingNews,
    advertisements: advertisements.map((advertisement) =>
      toAdvertisement(advertisement, toPublicUrl),
    ),
  };
}

export type PublicPageKey = 'about' | 'contact' | 'advertise';

/** A standalone page's own copy, plus the one set of contact details every
 * page shares. */
export async function getPage(
  { db }: PublicServiceDeps,
  page: PublicPageKey,
): Promise<PublicPageDto> {
  const settings = await repository.findPageSettings(db);
  if (!settings) {
    throw new NotFoundError('Site settings');
  }

  if (page === 'contact') {
    return {
      title: settings.contactTitle,
      intro: settings.contactIntro,
      content: null,
      email: settings.contactEmail,
      phone: settings.contactPhone,
      address: settings.contactAddress,
      hours: settings.contactHours,
    };
  }

  const isAbout = page === 'about';
  return {
    title: isAbout ? settings.aboutTitle : settings.advertiseTitle,
    intro: isAbout ? settings.aboutIntro : settings.advertiseIntro,
    content: toPageContent(
      isAbout ? settings.aboutContent : settings.advertiseContent,
    ),
    email: settings.contactEmail,
    phone: settings.contactPhone,
    address: null,
    hours: null,
  };
}

export async function getHome(
  { db, toPublicUrl }: PublicServiceDeps,
  language?: Language,
): Promise<PublicHomeDto> {
  const categories = await repository.findNavCategories(db, { language });
  const sectionCategories = categories.filter(
    (category) => category._count.articles > 0,
  );

  // One extra row per priority answers hasMore without a count query.
  const [leadStoryRows, featuredRows, recentRows, sectionArticles] =
    await Promise.all([
      repository.findRecentByPriority(db, 'LEAD_STORY', HOME_LEAD_STORIES + 1, {
        language,
      }),
      repository.findRecentByPriority(db, 'FEATURED', HOME_FEATURED + 1, {
        language,
      }),
      repository.findPublishedSince(
        db,
        new Date(Date.now() - TOP_STORIES_WINDOW_MS),
        // Deep enough that the stories filtered out below can't empty it.
        HOME_TOP_STORIES + HOME_LEAD_STORIES + HOME_FEATURED,
        { language },
      ),
      repository.findRecentForCategories(
        db,
        sectionCategories.map((category) => category.id),
        sectionCategories.length * CATEGORY_PREVIEW_ARTICLES * 2,
        { language },
      ),
    ]);

  const leadStories = leadStoryRows.slice(0, HOME_LEAD_STORIES);
  const featured = featuredRows.slice(0, HOME_FEATURED);
  const hasMoreLeadStories = leadStoryRows.length > HOME_LEAD_STORIES;
  const hasMoreFeatured = featuredRows.length > HOME_FEATURED;

  // Before any article is marked a lead story, the newest one stands in.
  const hero =
    leadStories[0] ??
    sectionArticles.reduce<(typeof sectionArticles)[number] | undefined>(
      (latest, article) =>
        !latest ||
        (article.publicationDate ?? new Date(0)) >
          (latest.publicationDate ?? new Date(0))
          ? article
          : latest,
      undefined,
    );
  const homeLeadStories = (hero ? [hero, ...leadStories.slice(1)] : []).filter(
    (article): article is NonNullable<typeof article> => Boolean(article),
  );

  // Only the lead package is held back from the sections below it. A story
  // can be both today's news and its category's news; dropping it from the
  // category would leave that category looking emptier than it is.
  const inLeadPackage = new Set(homeLeadStories.map((article) => article.id));
  const topStories = recentRows
    .filter(
      (article) =>
        !inLeadPackage.has(article.id) &&
        !featured.some((other) => other.id === article.id),
    )
    .slice(0, HOME_TOP_STORIES);

  const byCategory = new Map<string, typeof sectionArticles>();
  for (const article of sectionArticles) {
    if (!article.category || inLeadPackage.has(article.id)) continue;
    const bucket = byCategory.get(article.category.id) ?? [];
    if (bucket.length < CATEGORY_PREVIEW_ARTICLES) {
      bucket.push(article);
      byCategory.set(article.category.id, bucket);
    }
  }

  return {
    leadStories: homeLeadStories.map((article) =>
      toArticleCard(article, toPublicUrl),
    ),
    featured: featured.map((article) => toArticleCard(article, toPublicUrl)),
    topStories: topStories.map((article) =>
      toArticleCard(article, toPublicUrl),
    ),
    hasMoreLeadStories,
    hasMoreFeatured,
    categorySections: sectionCategories
      .map((category) => ({
        category: toNavCategory(category, toPublicUrl),
        articles: (byCategory.get(category.id) ?? []).map((article) =>
          toArticleCard(article, toPublicUrl),
        ),
      }))
      .filter((section) => section.articles.length > 0),
  };
}

export async function getArticlesByPriority(
  { db, toPublicUrl }: PublicServiceDeps,
  priority: 'LEAD_STORY' | 'FEATURED',
  filters: { language?: Language },
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findPublishedByPriority(
      db,
      priority,
      filters,
      toSkipTake(pagination),
    ),
    repository.countPublishedByPriority(db, priority, filters),
  ]);
  return {
    rows: rows.map((row) => toArticleCard(row, toPublicUrl)),
    total,
  };
}

export async function search(
  { db, toPublicUrl }: PublicServiceDeps,
  filters: { search: string; language?: Language },
  pagination: PaginationParams,
) {
  const { rows, total } = await articlesRepository.searchPublished(
    db,
    filters,
    toSkipTake(pagination),
  );
  return {
    rows: rows.map((row) => toArticleCard(row, toPublicUrl)),
    total,
  };
}
