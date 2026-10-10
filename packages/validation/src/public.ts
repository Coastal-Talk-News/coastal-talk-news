import { Type } from '@sinclair/typebox';
import {
  AdFitModeSchema,
  AdOffsetSchema,
  AdPlacementSchema,
  AdZoomSchema,
} from './advertisement.js';
import { ArticleContentSchema, LanguageSchema } from './article.js';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import {
  ImagePlacementSchema,
  ImageWidthPercentSchema,
  MediaSummarySchema,
} from './media.js';
import { ARTICLE_SLUG_MAX, SLUG_MAX } from './slug.js';

const PublicCategoryRefSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  nameKannada: Type.Union([Type.String(), Type.Null()]),
});

export const PublicArticleCardSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  headline: Type.String(),
  summary: Type.String(),
  language: LanguageSchema,
  category: Type.Union([PublicCategoryRefSchema, Type.Null()]),
  image: Type.Union([MediaSummarySchema, Type.Null()]),
  publicationDate: IsoDateTime,
});

export const PublicArticleParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

/** Category lookup by address. Only the length is bounded here: a malformed
 * slug simply matches nothing and 404s. */
export const PublicSlugParamsSchema = Type.Object({
  slug: Type.String({ minLength: 1, maxLength: SLUG_MAX }),
});

/** One article lookup serves both address forms: the slug every link
 * uses, and the id old shared links still carry (which then redirects). */
export const PublicArticleKeyParamsSchema = Type.Object({
  key: Type.Union([
    Type.String({ format: 'uuid' }),
    Type.String({ minLength: 1, maxLength: ARTICLE_SLUG_MAX }),
  ]),
});

export const PublicSitemapSchema = Type.Object({
  articles: Type.Array(
    Type.Object({ slug: Type.String(), updatedAt: IsoDateTime }),
  ),
  categories: Type.Array(
    Type.Object({ slug: Type.String(), updatedAt: IsoDateTime }),
  ),
});

export const PublicBreakingNewsSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  headlineKannada: Type.Union([Type.String(), Type.Null()]),
  articleUrl: Type.String(),
  articleUrlKannada: Type.Union([Type.String(), Type.Null()]),
});

const publicAdvertisementFields = {
  id: Type.String(),
  advertiserName: Type.String(),
  placement: AdPlacementSchema,
  image: MediaSummarySchema,
  fitMode: AdFitModeSchema,
  zoom: AdZoomSchema,
  offsetX: AdOffsetSchema,
  offsetY: AdOffsetSchema,
};

export const PublicAdvertisementSchema = Type.Object(publicAdvertisementFields);

export const PublicAdvertisementDetailSchema = Type.Object({
  ...publicAdvertisementFields,
  detailImage: Type.Union([MediaSummarySchema, Type.Null()]),
  description: Type.Union([ArticleContentSchema, Type.Null()]),
  descriptionKannada: Type.Union([ArticleContentSchema, Type.Null()]),
  destinationUrl: Type.Union([Type.String(), Type.Null()]),
  metaDescription: Type.Union([Type.String(), Type.Null()]),
});

export const PublicAdvertisementParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

const Nullable = (schema: ReturnType<typeof Type.String>) =>
  Type.Union([schema, Type.Null()]);

export const PublicSiteSettingsSchema = Type.Object({
  siteName: Type.String(),
  tagline: Nullable(Type.String()),
  logo: Type.Union([MediaSummarySchema, Type.Null()]),
  favicon: Type.Union([MediaSummarySchema, Type.Null()]),
  defaultUiLanguage: LanguageSchema,
  defaultSeoTitle: Nullable(Type.String()),
  defaultMetaDescription: Nullable(Type.String()),
  defaultOgImage: Type.Union([MediaSummarySchema, Type.Null()]),
  articleCacheMinutes: Type.Integer(),
  googleSiteVerification: Nullable(Type.String()),
  contactEmail: Nullable(Type.String()),
  contactPhone: Nullable(Type.String()),
  contactAddress: Nullable(Type.String()),
  facebookUrl: Nullable(Type.String()),
  instagramUrl: Nullable(Type.String()),
  youtubeUrl: Nullable(Type.String()),
  xUrl: Nullable(Type.String()),
  whatsappEnglishUrl: Nullable(Type.String()),
  whatsappKannadaUrl: Nullable(Type.String()),
});

const publicNavCategoryFields = {
  id: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  nameKannada: Type.Union([Type.String(), Type.Null()]),
  description: Nullable(Type.String()),
  articleCount: Type.Integer(),
  image: Type.Union([MediaSummarySchema, Type.Null()]),
  parentId: Type.Union([Type.String(), Type.Null()]),
};

// Grouping nests to any depth, so `children` refers back to this schema
// rather than bottoming out one level down.
export const PublicNavCategorySchema = Type.Recursive((Self) =>
  Type.Object({
    ...publicNavCategoryFields,
    children: Type.Array(Self),
  }),
);

export const PublicArticleSchema = Type.Composite([
  PublicArticleCardSchema,
  Type.Object({
    coverImage: Type.Union([
      Type.Object({
        url: Type.String(),
        width: Type.Integer(),
        height: Type.Integer(),
        widthPercent: ImageWidthPercentSchema,
        placement: ImagePlacementSchema,
      }),
      Type.Null(),
    ]),
    content: ArticleContentSchema,
    youtubeUrl: Nullable(Type.String()),
    tags: Type.Array(Type.String()),
    seoTitle: Nullable(Type.String()),
    metaDescription: Nullable(Type.String()),
    ogImage: Type.Union([MediaSummarySchema, Type.Null()]),
    updatedAt: IsoDateTime,
  }),
]);

export const PublicSiteSchema = Type.Object({
  settings: PublicSiteSettingsSchema,
  categories: Type.Array(PublicNavCategorySchema),
  breakingNews: Type.Array(PublicBreakingNewsSchema),
  advertisements: Type.Array(PublicAdvertisementSchema),
});

export const PublicHomeSchema = Type.Object({
  leadStories: Type.Array(PublicArticleCardSchema),
  featured: Type.Array(PublicArticleCardSchema),
  topStories: Type.Array(PublicArticleCardSchema),
  hasMoreLeadStories: Type.Boolean(),
  hasMoreFeatured: Type.Boolean(),
  categorySections: Type.Array(
    Type.Object({
      category: PublicNavCategorySchema,
      articles: Type.Array(PublicArticleCardSchema),
    }),
  ),
});

/**
 * One of the standalone pages. Kept off PublicSiteSchema on purpose: the site
 * payload is fetched for every page on the site, and the bodies here are whole
 * documents that only their own page needs.
 */
export const PublicPageSchema = Type.Object({
  title: Nullable(Type.String()),
  intro: Nullable(Type.String()),
  content: Type.Union([ArticleContentSchema, Type.Null()]),
  email: Nullable(Type.String()),
  phone: Nullable(Type.String()),
  address: Nullable(Type.String()),
  hours: Nullable(Type.String()),
});

export const PublicPageParamsSchema = Type.Object({
  page: Type.Union([
    Type.Literal('about'),
    Type.Literal('contact'),
    Type.Literal('advertise'),
    Type.Literal('privacy'),
    Type.Literal('terms'),
  ]),
});

// Omitted means English — About's Kannada body is opt-in per request, not a
// second document every caller must think about.
export const PublicPageQuerySchema = Type.Object({
  language: Type.Optional(LanguageSchema),
});

export const PublicSearchQuerySchema = Type.Object({
  q: Type.String({ minLength: 1, maxLength: 200 }),
  // Omitted entirely means "All" — both languages, mixed together.
  language: Type.Optional(LanguageSchema),
  ...paginationQueryFields,
});

export const PublicHomeQuerySchema = Type.Object({
  // Omitted entirely means both languages, mixed together.
  language: Type.Optional(LanguageSchema),
});

// Narrower than the CMS's ArticlePrioritySchema: there is no public NORMAL page.
export const PublicArticlePrioritySchema = Type.Union([
  Type.Literal('LEAD_STORY'),
  Type.Literal('FEATURED'),
]);

export const PublicArticlesQuerySchema = Type.Object({
  priority: PublicArticlePrioritySchema,
  language: Type.Optional(LanguageSchema),
  ...paginationQueryFields,
});

export const PublicRecentArticlesQuerySchema = Type.Object({
  language: Type.Optional(LanguageSchema),
  excludeId: Type.Optional(Type.String({ format: 'uuid' })),
  ...paginationQueryFields,
});
