import type { AdPlacement, Language } from '@coastal-talk-news/db';
import type {
  ArticleContent,
  PublicAdvertisementDetailDto,
  PublicAdvertisementDto,
  PublicArticleCardDto,
  PublicArticleDto,
  PublicNavCategoryDto,
  PublicSiteSettingsDto,
  RichTextContent,
} from '@coastal-talk-news/types';
import type {
  AdvertisementDetailRow,
  ArticleCardRow,
  ArticleDetailRow,
  NavCategoryRow,
} from './repository.js';

interface MediaRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

export type ToPublicUrl = (storageKey: string) => string;

function toMedia(media: MediaRow | null, toPublicUrl: ToPublicUrl) {
  return media
    ? {
        id: media.id,
        url: toPublicUrl(media.storageKey),
        width: media.width,
        height: media.height,
      }
    : null;
}

export function toArticleCard(
  article: ArticleCardRow,
  toPublicUrl: ToPublicUrl,
): PublicArticleCardDto {
  return {
    id: article.id,
    headline: article.headline,
    summary: article.summary,
    language: article.language,
    category: article.category,
    image: toMedia(article.media, toPublicUrl),
    // Only published articles reach here, so the date is always set.
    publicationDate: (article.publicationDate ?? new Date()).toISOString(),
  };
}

export function toArticleDetail(
  article: ArticleDetailRow,
  toPublicUrl: ToPublicUrl,
): PublicArticleDto {
  return {
    ...toArticleCard(article, toPublicUrl),
    // Prisma widens a Json column; the response schema re-checks the shape.
    content: article.content as unknown as ArticleContent,
    youtubeUrl: article.youtubeUrl,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    ogImage: toMedia(article.ogImage, toPublicUrl),
  };
}

export function toNavCategory(
  category: NavCategoryRow,
  toPublicUrl: ToPublicUrl,
): PublicNavCategoryDto {
  return {
    id: category.id,
    name: category.name,
    articleCount: category._count.articles,
    image: toMedia(category.media, toPublicUrl),
  };
}

interface AdvertisementRow {
  id: string;
  advertiserName: string;
  placement: AdPlacement;
  media: MediaRow;
}

export function toAdvertisement(
  advertisement: AdvertisementRow,
  toPublicUrl: ToPublicUrl,
): PublicAdvertisementDto {
  return {
    id: advertisement.id,
    advertiserName: advertisement.advertiserName,
    placement: advertisement.placement,
    image: {
      id: advertisement.media.id,
      url: toPublicUrl(advertisement.media.storageKey),
      width: advertisement.media.width,
      height: advertisement.media.height,
    },
  };
}

/** Meta descriptions are truncated, so the tag never carries the whole copy. */
const META_DESCRIPTION_MAX = 160;

function toMetaDescription(text: string | null): string | null {
  const trimmed = text?.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > META_DESCRIPTION_MAX
    ? `${trimmed.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`
    : trimmed;
}

export function toAdvertisementDetail(
  advertisement: AdvertisementDetailRow,
  toPublicUrl: ToPublicUrl,
): PublicAdvertisementDetailDto {
  return {
    ...toAdvertisement(advertisement, toPublicUrl),
    detailImage: toMedia(advertisement.detailMedia, toPublicUrl),
    description: (advertisement.description as RichTextContent | null) ?? null,
    destinationUrl: advertisement.destinationUrl,
    metaDescription: toMetaDescription(advertisement.descriptionText),
  };
}

interface SettingsRow {
  siteName: string;
  tagline: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  defaultUiLanguage: Language;
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  logo: MediaRow | null;
  favicon: MediaRow | null;
  defaultOgImage: MediaRow | null;
}

export function toSettings(
  settings: SettingsRow,
  toPublicUrl: ToPublicUrl,
): PublicSiteSettingsDto {
  const { logo, favicon, defaultOgImage, ...rest } = settings;
  return {
    ...rest,
    logo: toMedia(logo, toPublicUrl),
    favicon: toMedia(favicon, toPublicUrl),
    defaultOgImage: toMedia(defaultOgImage, toPublicUrl),
  };
}
