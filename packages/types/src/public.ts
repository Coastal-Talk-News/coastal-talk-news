import type { Id, IsoDateTime, RichTextContent } from './api.js';
import type { AdImageCrop, AdPlacement } from './advertisement.js';
import type { ArticleContent, Language } from './article.js';
import type { ImageLayoutDto, MediaSummaryDto } from './media.js';

export interface PublicCategoryRefDto {
  id: Id;
  /** The address segment: /category/<slug>. Falls back to the id for a
   * category not yet given a slug, which the reader site also accepts. */
  slug: string;
  name: string;
  /** Shown instead of `name` under the Kannada toggle; null falls back. */
  nameKannada: string | null;
}

/** Everything a card, list row or hero needs — never the article body. */
export interface PublicArticleCardDto {
  id: Id;
  /** The address segment: /article/<slug>. Falls back to the id for an
   * article without one yet, which the reader site also accepts. */
  slug: string;
  headline: string;
  summary: string;
  language: Language;
  category: PublicCategoryRefDto | null;
  image: MediaSummaryDto | null;
  publicationDate: IsoDateTime;
}

export interface PublicCoverImageDto extends Pick<
  ImageLayoutDto,
  'widthPercent' | 'placement'
> {
  /** Already cropped; `width` and `height` are the cropped picture's. */
  url: string;
  width: number;
  height: number;
}

/** `content` is a Tiptap document, not HTML: the reader site renders each node itself. */
export interface PublicArticleDto extends PublicArticleCardDto {
  /** The lead picture as the editor framed it: cropped, sized and placed. */
  coverImage: PublicCoverImageDto | null;
  content: ArticleContent;
  youtubeUrl: string | null;
  tags: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  ogImage: MediaSummaryDto | null;
  /** Last edited — the article's dateModified for search engines. */
  updatedAt: IsoDateTime;
}

export interface PublicBreakingNewsDto {
  id: Id;
  headline: string;
  /** Shown instead of `headline` under the Kannada toggle; null falls back. */
  headlineKannada: string | null;
  /** Empty when the item carries no outbound link. */
  articleUrl: string;
}

/**
 * What a banner needs and nothing more. Every ad links to its own page, so the
 * advertiser's URL and copy stay out of the site payload that each and every
 * page render carries.
 */
export interface PublicAdvertisementDto extends AdImageCrop {
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
  logo: MediaSummaryDto | null;
  favicon: MediaSummaryDto | null;
  /** What a reader sees before choosing one themselves. */
  defaultUiLanguage: Language;
  /** Site-wide SEO fallbacks for pages with nothing of their own. */
  defaultSeoTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: MediaSummaryDto | null;
  /** How long an article page is cached, in minutes, before re-checking it. */
  articleCacheMinutes: number;
  googleSiteVerification: string | null;
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
  description: string | null;
  articleCount: number;
  image: MediaSummaryDto | null;
  /** Null means top-level. Grouping can nest to any depth. */
  parentId: Id | null;
  /** This entry's direct children, each with its own `children` populated the
   * same way — walk it to render nesting of any depth. */
  children: PublicNavCategoryDto[];
}

/**
 * One of the standalone pages (About, Contact, Advertise). Every field is
 * optional: each falls back to a site-wide value or is simply left out, so a
 * page still renders before the newsroom has filled anything in.
 */
export interface PublicPageDto {
  title: string | null;
  intro: string | null;
  /** Tiptap document. Null on Contact, which is a set of details, not prose. */
  content: ArticleContent | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
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
 * Homepage feed, capped server-side. `leadStories[0]` is the hero and the
 * rest is the strip beside it; `topStories` is the last 24 hours. No story
 * appears in more than one of these.
 */
export interface PublicHomeDto {
  leadStories: PublicArticleCardDto[];
  featured: PublicArticleCardDto[];
  topStories: PublicArticleCardDto[];
  /** Whether the dedicated page holds more than is shown here. */
  hasMoreLeadStories: boolean;
  hasMoreFeatured: boolean;
  categorySections: PublicCategorySectionDto[];
}
