import type {
  PublicArticleDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';

/**
 * schema.org data for search engines, built from real records only: nothing
 * here is invented, and a value that isn't known is left out rather than sent
 * empty. Every URL is absolute and passes `absoluteUrl`, so an administrator's
 * typo can never turn into a broken or javascript: link in the output.
 */

type JsonLdValue =
  string | number | boolean | JsonLdValue[] | { [key: string]: JsonLdValue };
type JsonLdObject = { [key: string]: JsonLdValue };

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. `/category/udupi-district`. */
  path: string;
}

/** Http(s) only. Anything else — a relative path, a javascript: URL, junk —
 * comes back undefined so the property is simply omitted. */
function absoluteUrl(value: string | null | undefined, origin: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, origin);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

/** Drops undefined members, so optional facts don't serialise as nulls. */
function compact(
  object: Record<string, JsonLdValue | undefined>,
): JsonLdObject {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as JsonLdObject;
}

/** The profile itself, without the tracking parameters share links carry. */
function profileUrl(value: string | null, origin: string) {
  const url = absoluteUrl(value, origin);
  if (!url) return undefined;
  const parsed = new URL(url);
  parsed.search = '';
  parsed.hash = '';
  return parsed.href;
}

function organizationRef(origin: string) {
  return { '@id': `${origin}/#organization` };
}

export function websiteJsonLd(
  settings: PublicSiteSettingsDto,
  origin: string,
): JsonLdObject {
  return compact({
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: settings.siteName,
    url: `${origin}/`,
    inLanguage: ['en', 'kn'],
    publisher: organizationRef(origin),
  });
}

export function organizationJsonLd(
  settings: PublicSiteSettingsDto,
  origin: string,
): JsonLdObject {
  const logo = absoluteUrl(settings.logo?.url, origin);
  const sameAs = [
    settings.facebookUrl,
    settings.instagramUrl,
    settings.youtubeUrl,
    settings.xUrl,
  ]
    .map((value) => profileUrl(value, origin))
    .filter((value): value is string => Boolean(value));

  return compact({
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: settings.siteName,
    url: `${origin}/`,
    logo: logo
      ? compact({
          '@type': 'ImageObject',
          url: logo,
          width: settings.logo?.width,
          height: settings.logo?.height,
        })
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  });
}

export function newsArticleJsonLd(
  article: PublicArticleDto,
  settings: PublicSiteSettingsDto,
  origin: string,
  canonicalPath: string,
): JsonLdObject {
  const url = `${origin}${canonicalPath}`;
  const image = absoluteUrl((article.ogImage ?? article.image)?.url, origin);
  const logo = absoluteUrl(settings.logo?.url, origin);
  const description = article.metaDescription ?? article.summary;

  return compact({
    '@type': 'NewsArticle',
    headline: article.headline,
    description: description || undefined,
    image: image ? [image] : undefined,
    datePublished: article.publicationDate,
    dateModified: article.updatedAt,
    inLanguage: article.language === 'KANNADA' ? 'kn' : 'en',
    articleSection: article.category?.name,
    keywords: article.tags.length > 0 ? article.tags.join(', ') : undefined,
    // The newsroom publishes as itself: articles carry no byline in the data,
    // so no person is named here.
    author: compact({
      '@type': 'Organization',
      name: settings.siteName,
      url: `${origin}/`,
    }),
    publisher: compact({
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: settings.siteName,
      logo: logo ? { '@type': 'ImageObject', url: logo } : undefined,
    }),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  });
}

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
  origin: string,
): JsonLdObject {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}

/**
 * One script per page, holding every node in an @graph so nothing is
 * declared twice. `<` is escaped because the JSON sits inside a script tag:
 * a headline containing "</script>" must stay text, never end the tag.
 */
export function JsonLd({ data }: { data: JsonLdObject[] }) {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': data,
  }).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
