import type { SiteSettingsDto } from '@coastal-talk-news/types';

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
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  logo: MediaRow | null;
  favicon: MediaRow | null;
  defaultOgImage: MediaRow | null;
}

export type ToPublicUrl = (storageKey: string) => string;

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
    description: settings.description,
    logo: toMediaSummary(settings.logo, toPublicUrl),
    favicon: toMediaSummary(settings.favicon, toPublicUrl),
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    youtubeUrl: settings.youtubeUrl,
    xUrl: settings.xUrl,
    defaultSeoTitle: settings.defaultSeoTitle,
    defaultMetaDescription: settings.defaultMetaDescription,
    defaultOgImage: toMediaSummary(settings.defaultOgImage, toPublicUrl),
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}
