import type { Id, IsoDateTime, RichTextContent } from './api.js';
import type { AdPlacement } from './advertisement.js';
import type { ArticleContent, Language } from './article.js';
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

/** `content` is a Tiptap document, not HTML: the reader site renders each node itself. */
export interface PublicArticleDto extends PublicArticleCardDto {
  content: ArticleContent;
  youtubeUrl: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  ogImage: MediaSummaryDto | null;
}

export interface PublicBreakingNewsDto {
  id: Id;
  headline: string;
  /** Empty when the item carries no outbound link. */
  articleUrl: string;
}

/**
 * What a banner needs and nothing more. Every ad links to its own page, so the
 * advertiser's URL and copy stay out of the site payload that each and every
 * page render carries.
 */
export interface PublicAdvertisementDto {
  id: Id;
  advertiserName: string;
  placement: AdPlacement;
  image: MediaSummaryDto;
}

/** The ad's own page. Only this route pays for the description document. */
export interface PublicAdvertisementDetailDto extends PublicAdvertisementDto {
  detailImage: MediaSummaryDto | null;
  description: RichTextContent | null;
  destinationUrl: string | null;
  /** Server-trimmed excerpt for meta tags, so the page walks nothing itself. */
  metaDescription: string | null;
}

export interface PublicSiteSettingsDto {
  siteName: string;
  tagline: string | null;
  description: string | null;
  logo: MediaSummaryDto | null;
  favicon: MediaSummaryDto | null;
  /** What a reader sees before choosing one themselves. */
  defaultUiLanguage: Language;
  /** Site-wide SEO fallbacks for pages with nothing of their own. */
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: MediaSummaryDto | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
  /** The reader site picks whichever matches its current UI-language toggle. */
  whatsappEnglishUrl: string | null;
  whatsappKannadaUrl: string | null;
}

export interface PublicNavCategoryDto extends PublicCategoryRefDto {
  articleCount: number;
  image: MediaSummaryDto | null;
  /** Null means top-level. Capped at two levels, mirroring the CMS hierarchy. */
  parentId: Id | null;
  /** Populated on a top-level entry only; always empty on a child. */
  children: PublicNavCategoryDto[];
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

/**
 * Homepage feed, entirely category-driven: each section is one active category
 * with its most recent published articles (newest first). The homepage reads
 * article [0] of the first few sections as its lead story and article [1] of
 * the next few as "Top Stories" — there is no separate priority-based feed.
 */
export interface PublicHomeDto {
  categorySections: PublicCategorySectionDto[];
}
