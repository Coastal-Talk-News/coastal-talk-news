import type { MetadataRoute } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import type { PublicSitemapDto } from '@coastal-talk-news/types';
import { getSitemap } from '../lib/api';
import { articlePath, categoryPath } from '../lib/routes';
import { getOrigin } from '../lib/site-url';

/**
 * Rebuild the sitemap at most every 10 minutes.
 */
export const revalidate = 600;

/**
 * Public indexable pages that are not articles/categories.
 *
 * Search and preview pages are intentionally excluded.
 */
const STATIC_PATHS = [
  '/about',
  '/contact',
  '/advertise',
  '/privacy-policy',
  '/terms-and-conditions',
];

/**
 * Fetch sitemap data.
 *
 * During production build, if the API is unavailable,
 * return an empty dynamic sitemap so deployment does not fail.
 */
async function loadSitemap(): Promise<PublicSitemapDto> {
  try {
    return await getSitemap(revalidate);
  } catch (error) {
    if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
      throw error;
    }

    return {
      articles: [],
      categories: [],
    };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ articles, categories }, origin] = await Promise.all([
    loadSitemap(),
    getOrigin(),
  ]);

  const url = (path: string) => `${origin}${path}`;

  /**
   * Use the newest article's updatedAt as the homepage
   * lastModified value.
   *
   * articles[0] is expected to be the newest article.
   */
  const newestArticleUpdatedAt = articles[0]?.updatedAt;

  return [
    /**
     * Homepage
     */
    {
      url: url('/'),
      ...(newestArticleUpdatedAt
        ? {
            lastModified: newestArticleUpdatedAt,
          }
        : {}),
    },

    /**
     * Categories
     */
    ...categories.map((category) => ({
      url: url(categoryPath(category)),
      lastModified: category.updatedAt,
    })),

    /**
     * Static public pages
     */
    ...STATIC_PATHS.map((path) => ({
      url: url(path),
    })),

    /**
     * Published articles
     */
    ...articles.map((article) => ({
      url: url(articlePath(article)),
      lastModified: article.updatedAt,
    })),
  ];
}
