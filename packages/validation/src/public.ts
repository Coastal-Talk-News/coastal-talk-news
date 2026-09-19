import { Type } from '@sinclair/typebox';
import { AdPlacementSchema } from './advertisement.js';
import { ArticleContentSchema, LanguageSchema } from './article.js';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';

const PublicCategoryRefSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

export const PublicArticleCardSchema = Type.Object({
  id: Type.String(),
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

export const PublicBreakingNewsSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  articleUrl: Type.String(),
});

const publicAdvertisementFields = {
  id: Type.String(),
  advertiserName: Type.String(),
  placement: AdPlacementSchema,
  image: MediaSummarySchema,
};

export const PublicAdvertisementSchema = Type.Object(publicAdvertisementFields);

export const PublicAdvertisementDetailSchema = Type.Object({
  ...publicAdvertisementFields,
  detailImage: Type.Union([MediaSummarySchema, Type.Null()]),
  description: Type.Union([ArticleContentSchema, Type.Null()]),
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
  name: Type.String(),
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
    content: ArticleContentSchema,
    youtubeUrl: Nullable(Type.String()),
    seoTitle: Nullable(Type.String()),
    metaDescription: Nullable(Type.String()),
    ogImage: Type.Union([MediaSummarySchema, Type.Null()]),
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
  ]),
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
