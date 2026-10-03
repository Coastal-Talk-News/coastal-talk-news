import type { MetadataRoute } from 'next';
import { getOrigin } from '../lib/site-url';

/**
 * Static once PUBLIC_SITE_URL is set (production): nothing here changes
 * between requests. Locally, with no configured URL, it follows the host.
 *
 * Everything public is open to crawlers, images included. Only what has no
 * business in a search index is held back: the site's own endpoints, internal
 * search results, and editors' draft previews (which are noindex as well).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/search', '/preview'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
