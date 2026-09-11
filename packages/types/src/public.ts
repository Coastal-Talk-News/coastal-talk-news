import type { Id, IsoDateTime } from './api.js';
import type { Language } from './article.js';
import type { MediaSummaryDto } from './media.js';

export interface PublicCategoryRefDto {
  id: Id;
  name: string;
}

/** Everything a card, list row or hero needs — never the article body. */
export interface PublicArticleCardDto {
  id: Id;
  headline: string;
  summary: string;
  language: Language;
  category: PublicCategoryRefDto | null;
  image: MediaSummaryDto | null;
  publicationDate: IsoDateTime;
}

export interface PublicBreakingNewsDto {
  id: Id;
  headline: string;
  /** Empty when the item carries no outbound link. */
  articleUrl: string;
}

export interface PublicAdvertisementDto {
  id: Id;
  advertiserName: string;
  destinationUrl: string;
  image: MediaSummaryDto;
}

export interface PublicSiteSettingsDto {
  siteName: string;
  tagline: string | null;
  description: string | null;
  logo: MediaSummaryDto | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
}

export interface PublicNavCategoryDto extends PublicCategoryRefDto {
  articleCount: number;
  image: MediaSummaryDto | null;
}

/** The site shell: everything the header, ticker and footer need. */
export interface PublicSiteDto {
  settings: PublicSiteSettingsDto;
  categories: PublicNavCategoryDto[];
  breakingNews: PublicBreakingNewsDto[];
  advertisements: PublicAdvertisementDto[];
}

export interface PublicCategorySectionDto {
  category: PublicNavCategoryDto;
  articles: PublicArticleCardDto[];
}

export interface PublicHomeDto {
  leadStory: PublicArticleCardDto | null;
  topStories: PublicArticleCardDto[];
  latestNews: PublicArticleCardDto[];
  categorySections: PublicCategorySectionDto[];
}
