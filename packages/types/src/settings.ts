import type { Id, IsoDateTime } from './api.js';
import type { ArticleContent } from './article.js';
import type { MediaSummaryDto } from './media.js';

export interface SiteSettingsDto {
  id: Id;
  siteName: string;
  tagline: string | null;
  logo: MediaSummaryDto | null;
  favicon: MediaSummaryDto | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  aboutTitle: string | null;
  aboutIntro: string | null;
  aboutContent: ArticleContent | null;
  /** Falls back to `aboutContent` on the reader site when null. */
  aboutContentKannada: ArticleContent | null;
  contactTitle: string | null;
  contactIntro: string | null;
  contactHours: string | null;
  advertiseTitle: string | null;
  advertiseIntro: string | null;
  advertiseContent: ArticleContent | null;
  privacyContent: ArticleContent | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  whatsappEnglishUrl: string | null;
  whatsappKannadaUrl: string | null;
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: MediaSummaryDto | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface UpdateSiteSettingsRequest {
  siteName?: string;
  tagline?: string | null;
  logoMediaId?: Id | null;
  faviconMediaId?: Id | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  aboutTitle?: string | null;
  aboutIntro?: string | null;
  aboutContent?: ArticleContent | null;
  aboutContentKannada?: ArticleContent | null;
  contactTitle?: string | null;
  contactIntro?: string | null;
  contactHours?: string | null;
  advertiseTitle?: string | null;
  advertiseIntro?: string | null;
  advertiseContent?: ArticleContent | null;
  privacyContent?: ArticleContent | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  whatsappEnglishUrl?: string | null;
  whatsappKannadaUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageId?: Id | null;
}
