import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';

const NullableString = Type.Union([Type.String(), Type.Null()]);

export const SeoArticleIssueSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  publicationDate: Type.Union([IsoDateTime, Type.Null()]),
  missingSeoTitle: Type.Boolean(),
  missingMetaDescription: Type.Boolean(),
  missingSlug: Type.Boolean(),
  missingFeaturedImage: Type.Boolean(),
});

export const SeoArticlesQuerySchema = Type.Object({
  ...paginationQueryFields,
});

export const SeoHealthSchema = Type.Object({
  site: Type.Object({
    siteName: Type.String(),
    defaultSeoTitle: NullableString,
    defaultMetaDescription: NullableString,
    hasLogo: Type.Boolean(),
    hasFavicon: Type.Boolean(),
    hasDefaultOgImage: Type.Boolean(),
    hasGoogleSiteVerification: Type.Boolean(),
    socialProfiles: Type.Integer(),
  }),
  articles: Type.Object({
    published: Type.Integer(),
    missingSeoTitle: Type.Integer(),
    missingMetaDescription: Type.Integer(),
    missingSlug: Type.Integer(),
    missingFeaturedImage: Type.Integer(),
  }),
  categories: Type.Object({
    active: Type.Integer(),
    missingSeoTitle: Type.Integer(),
    missingMetaDescription: Type.Integer(),
    missingSlug: Type.Integer(),
    items: Type.Array(
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        parentName: NullableString,
        missingSeoTitle: Type.Boolean(),
        missingMetaDescription: Type.Boolean(),
        missingSlug: Type.Boolean(),
      }),
    ),
  }),
});
