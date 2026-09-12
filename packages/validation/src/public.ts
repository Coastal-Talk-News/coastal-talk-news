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

export const PublicAdvertisementSchema = Type.Object({
  id: Type.String(),
  advertiserName: Type.String(),
  destinationUrl: Type.String(),
  placement: AdPlacementSchema,
  image: MediaSummarySchema,
});

const Nullable = (schema: ReturnType<typeof Type.String>) =>
  Type.Union([schema, Type.Null()]);

export const PublicSiteSettingsSchema = Type.Object({
  siteName: Type.String(),
  tagline: Nullable(Type.String()),
  description: Nullable(Type.String()),
  logo: Type.Union([MediaSummarySchema, Type.Null()]),
  contactEmail: Nullable(Type.String()),
  contactPhone: Nullable(Type.String()),
  contactAddress: Nullable(Type.String()),
  facebookUrl: Nullable(Type.String()),
  instagramUrl: Nullable(Type.String()),
  youtubeUrl: Nullable(Type.String()),
  xUrl: Nullable(Type.String()),
});

export const PublicNavCategorySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  articleCount: Type.Integer(),
  image: Type.Union([MediaSummarySchema, Type.Null()]),
});

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
  categorySections: Type.Array(
    Type.Object({
      category: PublicNavCategorySchema,
      articles: Type.Array(PublicArticleCardSchema),
    }),
  ),
});

export const PublicSearchQuerySchema = Type.Object({
  q: Type.String({ minLength: 1, maxLength: 200 }),
  // Omitted entirely means "All" — both languages, mixed together.
  language: Type.Optional(LanguageSchema),
  ...paginationQueryFields,
});
