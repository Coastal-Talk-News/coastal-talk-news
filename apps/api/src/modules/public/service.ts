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

const TOP_STORIES = 6;
const LATEST_NEWS = 6;
const SECTION_CATEGORIES = 4;
const SECTION_ARTICLES = 3;

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
  const [leadStories, featured, categories] = await Promise.all([
    repository.findByPriority(db, 'LEAD_STORY', 1),
    repository.findByPriority(db, 'FEATURED', TOP_STORIES),
    repository.findNavCategories(db),
  ]);

  const leadStory = leadStories[0] ?? null;
  // Latest is a catch-all strip, so it should not repeat what is already above.
  const shown = [
    leadStory?.id,
    ...featured.map((article) => article.id),
  ].filter((id): id is string => Boolean(id));
  const latest = await repository.findLatest(db, LATEST_NEWS, shown);

  const sectionCategories = categories
    .filter((category) => category._count.articles > 0)
    .slice(0, SECTION_CATEGORIES);

  const sectionArticles = await repository.findRecentForCategories(
    db,
    sectionCategories.map((category) => category.id),
    sectionCategories.length * SECTION_ARTICLES * 2,
  );

  const byCategory = new Map<string, typeof sectionArticles>();
  for (const article of sectionArticles) {
    if (!article.category) continue;
    const bucket = byCategory.get(article.category.id) ?? [];
    if (bucket.length < SECTION_ARTICLES) {
      bucket.push(article);
      byCategory.set(article.category.id, bucket);
    }
  }

  return {
    leadStory: leadStory ? toArticleCard(leadStory, toPublicUrl) : null,
    topStories: featured.map((article) => toArticleCard(article, toPublicUrl)),
    latestNews: latest.map((article) => toArticleCard(article, toPublicUrl)),
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
