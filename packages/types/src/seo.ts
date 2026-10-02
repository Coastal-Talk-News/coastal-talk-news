import type { Id, IsoDateTime } from './api.js';

/**
 * Everything the reader site's sitemap.xml needs and nothing else: each
 * published article's and active category's slug with its last edit — so the
 * feed stays small however many articles the newsroom publishes.
 */
export interface PublicSitemapDto {
  /** `slug` falls back to the id for an article without one yet. */
  articles: Array<{ slug: string; updatedAt: IsoDateTime }>;
  categories: Array<{ slug: string; updatedAt: IsoDateTime }>;
}

/** What a published article is missing, for the CMS SEO page's list —
 * served a page at a time, most recent first (`GET /cms/seo/articles`). */
export interface SeoArticleIssueDto {
  id: Id;
  headline: string;
  publicationDate: IsoDateTime | null;
  missingSeoTitle: boolean;
  missingMetaDescription: boolean;
  missingSlug: boolean;
  missingFeaturedImage: boolean;
}

export interface SeoCategoryIssueDto {
  id: Id;
  name: string;
  /** Null for a top-level section. */
  parentName: string | null;
  missingSeoTitle: boolean;
  missingMetaDescription: boolean;
  missingSlug: boolean;
}

/**
 * The CMS SEO page. Only facts read from the database: no score, since none
 * of this predicts how Google ranks a page. A missing SEO title or description
 * is not an error either — the reader site falls back to the headline and
 * summary — so these are prompts to improve, not failures.
 */
export interface SeoHealthDto {
  site: {
    siteName: string;
    defaultSeoTitle: string | null;
    defaultMetaDescription: string | null;
    hasLogo: boolean;
    hasFavicon: boolean;
    hasDefaultOgImage: boolean;
    hasGoogleSiteVerification: boolean;
    /** Social profiles that will appear in the Organization's `sameAs`. */
    socialProfiles: number;
  };
  articles: {
    published: number;
    missingSeoTitle: number;
    missingMetaDescription: number;
    missingSlug: number;
    missingFeaturedImage: number;
  };
  categories: {
    active: number;
    missingSeoTitle: number;
    missingMetaDescription: number;
    missingSlug: number;
    items: SeoCategoryIssueDto[];
  };
}

/**
 * The homepage's description of last resort: used only when the newsroom has
 * written neither a description (SEO → Search defaults) nor a tagline (Settings →
 * General). Shared so the reader site and the CMS hint that names the
 * fallback can never disagree.
 */
export function defaultSiteDescription(siteName: string): string {
  return `${siteName} brings the latest Kannada and English news from Udupi, Dakshina Kannada, Uttara Kannada, Karnataka, India and international locations.`;
}
