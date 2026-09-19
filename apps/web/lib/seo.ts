import type { Metadata } from 'next';
import type {
  MediaSummaryDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import type { Locale } from './i18n/types';

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_IN',
  kn: 'kn_IN',
};

export interface PageMetadataInput {
  settings: PublicSiteSettingsDto;
  locale: Locale;
  origin: string;
  title?: string;
  description?: string | null;
  image?: MediaSummaryDto | null;
  path?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  noIndex?: boolean;
}

/**
 * Each value falls back along one chain: the page's own, then the newsroom's
 * configured default, then whatever is left. Anything still missing is omitted
 * rather than emitted empty.
 */
export function buildMetadata({
  settings,
  locale,
  origin,
  title,
  description,
  image,
  path = '/',
  type = 'website',
  publishedTime,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const siteTitle = settings.defaultSeoTitle ?? defaultSiteTitle(settings);
  const resolvedDescription = description ?? settings.defaultMetaDescription;
  const resolvedImage = image ?? settings.defaultOgImage ?? settings.logo;

  return {
    metadataBase: new URL(origin),
    // A bare title lets the root's template append the masthead to it.
    title: title
      ? title
      : { default: siteTitle, template: `%s — ${settings.siteName}` },
    description: resolvedDescription ?? undefined,
    applicationName: settings.siteName,
    icons: toIcons(settings.favicon),
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: settings.siteName,
      locale: OG_LOCALE[locale],
      url: `${origin}${path}`,
      title: title ?? siteTitle,
      description: resolvedDescription ?? undefined,
      ...(publishedTime ? { publishedTime } : {}),
      ...(resolvedImage ? { images: [toOgImage(resolvedImage)] } : {}),
    },
    twitter: {
      card: resolvedImage ? 'summary_large_image' : 'summary',
      title: title ?? siteTitle,
      description: resolvedDescription ?? undefined,
      ...(resolvedImage ? { images: [resolvedImage.url] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

function defaultSiteTitle(settings: PublicSiteSettingsDto): string {
  return settings.tagline
    ? `${settings.siteName} — ${settings.tagline}`
    : settings.siteName;
}

function toOgImage(image: MediaSummaryDto) {
  return { url: image.url, width: image.width, height: image.height };
}

/** Undefined, not an empty list, so Next falls through to its file convention. */
function toIcons(favicon: MediaSummaryDto | null): Metadata['icons'] {
  if (!favicon) return undefined;
  return {
    icon: [{ url: favicon.url }],
    shortcut: [{ url: favicon.url }],
    apple: [{ url: favicon.url }],
  };
}
