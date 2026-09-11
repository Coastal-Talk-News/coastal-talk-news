import type { Database } from '@coastal-talk-news/db';
import type { PublicHomeDto, PublicSiteDto } from '@coastal-talk-news/types';
import { NotFoundError } from '../../lib/errors.js';
import {
  toAdvertisement,
  toArticleCard,
  toNavCategory,
  toSettings,
  type ToPublicUrl,
} from './mapper.js';
import * as repository from './repository.js';

export interface PublicServiceDeps {
  db: Database;
  toPublicUrl: ToPublicUrl;
}

// The homepage reads this same list twice, at two different depths: the first
// HERO_CATEGORIES sections supply the lead story + its sidebar (article 0 of
// each), and the first TOP_STORY_CATEGORIES supply "Top Stories" (article 1 of
// each) — see apps/web/app/page.tsx. Fetching HOME_SECTION_ARTICLES per
// category up front covers both reads in one query.
const HOME_SECTION_CATEGORIES = 6;
const HOME_SECTION_ARTICLES = 2;

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
    categories: categories.map((category) =>
      toNavCategory(category, toPublicUrl),
    ),
    breakingNews,
    advertisements: advertisements.map((advertisement) =>
      toAdvertisement(advertisement, toPublicUrl),
    ),
  };
}

export async function getHome({
  db,
  toPublicUrl,
}: PublicServiceDeps): Promise<PublicHomeDto> {
  const categories = await repository.findNavCategories(db);

  const sectionCategories = categories
    .filter((category) => category._count.articles > 0)
    .slice(0, HOME_SECTION_CATEGORIES);

  const sectionArticles = await repository.findRecentForCategories(
    db,
    sectionCategories.map((category) => category.id),
    sectionCategories.length * HOME_SECTION_ARTICLES * 2,
  );

  const byCategory = new Map<string, typeof sectionArticles>();
  for (const article of sectionArticles) {
    if (!article.category) continue;
    const bucket = byCategory.get(article.category.id) ?? [];
    if (bucket.length < HOME_SECTION_ARTICLES) {
      bucket.push(article);
      byCategory.set(article.category.id, bucket);
    }
  }

  return {
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
