import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

/// Effectively a singleton — exactly one row, created by the seed.
export interface SiteSettingsDto {
  id: Id;
  siteName: string;
  tagline: string | null;
  description: string | null;
  logo: MediaSummaryDto | null;
  favicon: MediaSummaryDto | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: MediaSummaryDto | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface UpdateSiteSettingsRequest {
  siteName?: string;
  tagline?: string | null;
  description?: string | null;
  logoMediaId?: Id | null;
  faviconMediaId?: Id | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageId?: Id | null;
}
