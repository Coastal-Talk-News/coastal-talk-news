import type { Metadata } from 'next';
import {
  defaultSiteDescription,
  type MediaSummaryDto,
  type PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import type { Locale } from './i18n/types';

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_IN',
  kn: 'kn_IN',
};

/**
 * What the site is, in one sentence: the description the newsroom wrote in
 * SEO → Search defaults, else the tagline the masthead shows ("News and Narratives
 * from Coastal Karnataka"), so the snippet matches what readers see. Without
 * one Google builds the homepage snippet from whatever headlines are on it.
 */
export function siteDescription(settings: PublicSiteSettingsDto): string {
  return (
    settings.defaultMetaDescription?.trim() ||
    settings.tagline?.trim() ||
    defaultSiteDescription(settings.siteName)
  );
}

/** The homepage's title: the configured one, else simply the site's name. */
export function homeTitle(settings: PublicSiteSettingsDto): string {
  return settings.defaultSeoTitle?.trim() || settings.siteName;
}

function toOgImage(image: MediaSummaryDto) {
  return { url: image.url, width: image.width, height: image.height };
}

/**
 * Undefined, not an empty list, so Next falls through to its file convention.
 * One `icon` link only: a `shortcut` link to the same file made browsers
 * download the favicon twice. The apple-touch link is fetched only by iOS
 * home-screen saves, not on page loads.
 */
function toIcons(favicon: MediaSummaryDto | null): Metadata['icons'] {
  if (!favicon) return undefined;
  return {
    icon: [{ url: favicon.url }],
    apple: [{ url: favicon.url }],
  };
}

interface SiteMetadataInput {
  settings: PublicSiteSettingsDto;
  locale: Locale;
  origin: string;
}

/**
 * The root layout's defaults, inherited by every page that doesn't override
 * them. Deliberately no canonical URL: one set here would be inherited by
 * pages that must not claim one (not-found, previews), pointing them all at
 * the homepage.
 */
export function buildSiteMetadata({
  settings,
  locale,
  origin,
}: SiteMetadataInput): Metadata {
  const image = settings.defaultOgImage ?? settings.logo;
  const description = siteDescription(settings);

  return {
    metadataBase: new URL(origin),
    title: {
      default: homeTitle(settings),
      template: `%s | ${settings.siteName}`,
    },
    description,
    applicationName: settings.siteName,
    icons: toIcons(settings.favicon),
    ...(settings.googleSiteVerification
      ? { verification: { google: settings.googleSiteVerification } }
      : {}),
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      locale: OG_LOCALE[locale],
      description,
      ...(image ? { images: [toOgImage(image)] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}

export interface PageMetadataInput {
  settings: PublicSiteSettingsDto;
  locale: Locale;
  origin: string;
  /** Gets " | <site name>" appended. */
  title?: string;
  /** Used exactly as written: an SEO title the newsroom set by hand. */
  absoluteTitle?: string;
  description?: string | null;
  image?: MediaSummaryDto | null;
  /** The page's canonical path: no query string, so ?page=2 or a tracking
   * parameter never becomes an address of its own. */
  path: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
}

/**
 * One page's tags. Each value falls back along one chain — the page's own,
 * then the newsroom's site-wide default — and anything still missing is left
 * out rather than emitted empty.
 */
export function buildMetadata({
  settings,
  locale,
  origin,
  title,
  absoluteTitle,
  description,
  image,
  path,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags,
  noIndex = false,
}: PageMetadataInput): Metadata {
  // A page titled just the site's name would otherwise read "X | X".
  const exact =
    absoluteTitle ?? (title === settings.siteName ? title : undefined);
  const shareTitle = exact ?? title ?? homeTitle(settings);
  const resolvedDescription = description?.trim() || siteDescription(settings);
  const resolvedImage = image ?? settings.defaultOgImage ?? settings.logo;
  const url = new URL(path, origin).href;

  return {
    title: exact ? { absolute: exact } : title,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      type,
      siteName: settings.siteName,
      locale: OG_LOCALE[locale],
      url,
      title: shareTitle,
      description: resolvedDescription,
      ...(type === 'article'
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(section ? { section } : {}),
            ...(tags && tags.length > 0 ? { tags } : {}),
          }
        : {}),
      ...(resolvedImage ? { images: [toOgImage(resolvedImage)] } : {}),
    },
    twitter: {
      card: resolvedImage ? 'summary_large_image' : 'summary',
      title: shareTitle,
      description: resolvedDescription,
      ...(resolvedImage ? { images: [resolvedImage.url] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
