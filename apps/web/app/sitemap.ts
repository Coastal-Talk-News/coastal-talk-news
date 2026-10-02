import type { MetadataRoute } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import type { PublicSitemapDto } from '@coastal-talk-news/types';
import { getSitemap } from '../lib/api';
import { articlePath, categoryPath } from '../lib/routes';
import { getOrigin } from '../lib/site-url';

/**
 * Served from the cache and rebuilt in the background at most every ten
 * minutes: crawlers fetch it often, and rebuilding it on each of those would
 * be a server run and an API call apiece. A new article is listed within ten
 * minutes, with no redeploy. Article and section pages never touch it.
 */
export const revalidate = 600;

/** Public pages that aren't articles or sections. Search and previews are
 * deliberately absent: neither is a page search engines should index. */
const STATIC_PATHS = [
  '/featured',
  '/lead-stories',
  '/about',
  '/contact',
  '/advertise',
  '/advertisements',
  '/privacy-policy',
  '/terms-and-conditions',
];

/**
 * A sleeping API must not fail the deploy, so at build time a failed fetch
 * gives a sitemap of the fixed pages, replaced on the first rebuild. After
 * that a failure throws, and Next keeps serving the last good sitemap.
 */
async function loadSitemap(): Promise<PublicSitemapDto> {
  try {
    return await getSitemap(revalidate);
  } catch (error) {
    if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) throw error;
    return { articles: [], categories: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ articles, categories }, origin] = await Promise.all([
    loadSitemap(),
    getOrigin(),
  ]);
  const url = (path: string) => `${origin}${path}`;

  // Only drafts and archived articles are missing from the feed, so the
  // newest published article dates the homepage's last change.
  const newest = articles[0]?.updatedAt;

  return [
    {
      url: url('/'),
      ...(newest ? { lastModified: newest } : {}),
      changeFrequency: 'hourly',
      priority: 1,
    },
    ...categories.map((category) => ({
      url: url(categoryPath(category)),
      lastModified: category.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...STATIC_PATHS.map((path) => ({
      url: url(path),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
    ...articles.map((article) => ({
      url: url(articlePath(article)),
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
