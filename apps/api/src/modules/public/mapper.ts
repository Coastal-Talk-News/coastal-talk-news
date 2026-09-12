import type { AdPlacement } from '@coastal-talk-news/db';
import type {
  PublicAdvertisementDto,
  PublicArticleCardDto,
  PublicNavCategoryDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import type { ArticleCardRow, NavCategoryRow } from './repository.js';

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
  destinationUrl: string;
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
    destinationUrl: advertisement.destinationUrl,
    placement: advertisement.placement,
    image: {
      id: advertisement.media.id,
      url: toPublicUrl(advertisement.media.storageKey),
      width: advertisement.media.width,
      height: advertisement.media.height,
    },
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
  logo: MediaRow | null;
}

export function toSettings(
  settings: SettingsRow,
  toPublicUrl: ToPublicUrl,
): PublicSiteSettingsDto {
  const { logo, ...rest } = settings;
  return { ...rest, logo: toMedia(logo, toPublicUrl) };
}
