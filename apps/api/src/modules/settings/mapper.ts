import type { ArticleContent, SiteSettingsDto } from '@coastal-talk-news/types';

interface MediaRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

export interface SiteSettingsEntity {
  id: string;
  siteName: string;
  tagline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  aboutTitle: string | null;
  aboutIntro: string | null;
  aboutContent: unknown;
  aboutContentKannada: unknown;
  contactTitle: string | null;
  contactIntro: string | null;
  contactHours: string | null;
  advertiseTitle: string | null;
  advertiseIntro: string | null;
  advertiseContent: unknown;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  whatsappEnglishUrl: string | null;
  whatsappKannadaUrl: string | null;
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  logo: MediaRow | null;
  favicon: MediaRow | null;
  defaultOgImage: MediaRow | null;
}

export type ToPublicUrl = (storageKey: string) => string;

/** Prisma widens a Json column to its own union; the response schema
 * re-checks the document's shape on the way out. */
export function toContent(value: unknown): ArticleContent | null {
  return value ? (value as ArticleContent) : null;
}

function toMediaSummary(media: MediaRow | null, toPublicUrl: ToPublicUrl) {
  return media
    ? {
        id: media.id,
        url: toPublicUrl(media.storageKey),
        width: media.width,
        height: media.height,
      }
    : null;
}

export function toSiteSettingsDto(
  settings: SiteSettingsEntity,
  toPublicUrl: ToPublicUrl,
): SiteSettingsDto {
  return {
    id: settings.id,
    siteName: settings.siteName,
    tagline: settings.tagline,
    logo: toMediaSummary(settings.logo, toPublicUrl),
    favicon: toMediaSummary(settings.favicon, toPublicUrl),
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    aboutTitle: settings.aboutTitle,
    aboutIntro: settings.aboutIntro,
    aboutContent: toContent(settings.aboutContent),
    aboutContentKannada: toContent(settings.aboutContentKannada),
    contactTitle: settings.contactTitle,
    contactIntro: settings.contactIntro,
    contactHours: settings.contactHours,
    advertiseTitle: settings.advertiseTitle,
    advertiseIntro: settings.advertiseIntro,
    advertiseContent: toContent(settings.advertiseContent),
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    youtubeUrl: settings.youtubeUrl,
    xUrl: settings.xUrl,
    whatsappEnglishUrl: settings.whatsappEnglishUrl,
    whatsappKannadaUrl: settings.whatsappKannadaUrl,
    defaultSeoTitle: settings.defaultSeoTitle,
    defaultMetaDescription: settings.defaultMetaDescription,
    defaultOgImage: toMediaSummary(settings.defaultOgImage, toPublicUrl),
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}
