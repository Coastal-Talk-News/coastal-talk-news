import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { ImageLayoutSchema, MediaSummarySchema } from './media.js';
import {
  ARTICLE_HEADLINE_MAX,
  ARTICLE_SUMMARY_MAX,
  ARTICLE_SEO_TITLE_MAX,
  ARTICLE_META_DESCRIPTION_MAX,
  ARTICLE_TAG_MAX,
  ARTICLE_TAGS_MAX,
} from './limits.js';

export {
  ARTICLE_HEADLINE_MAX,
  ARTICLE_SUMMARY_MAX,
  ARTICLE_SEO_TITLE_MAX,
  ARTICLE_META_DESCRIPTION_MAX,
  ARTICLE_TAG_MAX,
  ARTICLE_TAGS_MAX,
};

export const LanguageSchema = Type.Union([
  Type.Literal('ENGLISH'),
  Type.Literal('KANNADA'),
]);

export const ArticlePrioritySchema = Type.Union([
  Type.Literal('LEAD_STORY'),
  Type.Literal('FEATURED'),
  Type.Literal('NORMAL'),
]);

export const ArticleStatusSchema = Type.Union([
  Type.Literal('DRAFT'),
  Type.Literal('PUBLISHED'),
  Type.Literal('ARCHIVED'),
]);

export const CreatableArticleStatusSchema = Type.Union([
  Type.Literal('DRAFT'),
  Type.Literal('PUBLISHED'),
]);

export const ArticleContentSchema = Type.Object(
  {
    type: Type.Literal('doc'),
    content: Type.Array(Type.Unknown()),
  },
  { additionalProperties: true },
);

const NullableId = Type.Union([Type.String({ format: 'uuid' }), Type.Null()]);

const TagsSchema = Type.Array(
  Type.String({ minLength: 1, maxLength: ARTICLE_TAG_MAX }),
  { maxItems: ARTICLE_TAGS_MAX },
);

const articleFields = {
  id: Type.String(),
  categoryId: Type.Union([Type.String(), Type.Null()]),
  categoryName: Type.Union([Type.String(), Type.Null()]),
  language: LanguageSchema,
  headline: Type.String(),
  summary: Type.String(),
  content: ArticleContentSchema,
  youtubeUrl: Type.Union([Type.String(), Type.Null()]),
  tags: TagsSchema,
  priority: ArticlePrioritySchema,
  status: ArticleStatusSchema,
  publicationDate: Type.Union([IsoDateTime, Type.Null()]),
  seoTitle: Type.Union([Type.String(), Type.Null()]),
  metaDescription: Type.Union([Type.String(), Type.Null()]),
  featuredImage: Type.Union([MediaSummarySchema, Type.Null()]),
  featuredImageLayout: ImageLayoutSchema,
  ogImage: Type.Union([MediaSummarySchema, Type.Null()]),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
};

export const ArticleSchema = Type.Object(articleFields);

const writableArticleFields = {
  categoryId: Type.String({ format: 'uuid' }),
  language: LanguageSchema,
  headline: Type.String({ minLength: 1, maxLength: ARTICLE_HEADLINE_MAX }),
  summary: Type.String({ minLength: 1, maxLength: ARTICLE_SUMMARY_MAX }),
  content: ArticleContentSchema,
  youtubeUrl: Type.Union([Type.String({ format: 'uri' }), Type.Null()]),
  tags: TagsSchema,
  priority: ArticlePrioritySchema,
  featuredImageId: NullableId,
  featuredImageLayout: ImageLayoutSchema,
  ogImageId: NullableId,
  seoTitle: Type.Union([
    Type.String({ maxLength: ARTICLE_SEO_TITLE_MAX }),
    Type.Null(),
  ]),
  metaDescription: Type.Union([
    Type.String({ maxLength: ARTICLE_META_DESCRIPTION_MAX }),
    Type.Null(),
  ]),
};

export const CreateArticleBodySchema = Type.Object(
  {
    categoryId: writableArticleFields.categoryId,
    language: writableArticleFields.language,
    headline: writableArticleFields.headline,
    summary: writableArticleFields.summary,
    content: writableArticleFields.content,
    youtubeUrl: Type.Optional(writableArticleFields.youtubeUrl),
    tags: Type.Optional(writableArticleFields.tags),
    priority: Type.Optional(writableArticleFields.priority),
    status: Type.Optional(CreatableArticleStatusSchema),
    featuredImageId: Type.Optional(writableArticleFields.featuredImageId),
    featuredImageLayout: Type.Optional(
      writableArticleFields.featuredImageLayout,
    ),
    ogImageId: Type.Optional(writableArticleFields.ogImageId),
    seoTitle: Type.Optional(writableArticleFields.seoTitle),
    metaDescription: Type.Optional(writableArticleFields.metaDescription),
  },
  { additionalProperties: false },
);

export const UpdateArticleBodySchema = Type.Partial(
  Type.Object({ ...writableArticleFields, status: ArticleStatusSchema }),
  {
    minProperties: 1,
    additionalProperties: false,
  },
);

export const ArticleParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const ArticleSortSchema = Type.Union([
  Type.Literal('newest'),
  Type.Literal('oldest'),
]);

export const CmsArticleListQuerySchema = Type.Object({
  ...paginationQueryFields,
  categoryId: Type.Optional(Type.String({ format: 'uuid' })),
  language: Type.Optional(LanguageSchema),
  status: Type.Optional(ArticleStatusSchema),
  priority: Type.Optional(ArticlePrioritySchema),
  search: Type.Optional(Type.String({ maxLength: 200 })),
  sort: Type.Optional(ArticleSortSchema),
});

export const CmsArticleCountsQuerySchema = Type.Object({
  categoryId: Type.Optional(Type.String({ format: 'uuid' })),
  language: Type.Optional(LanguageSchema),
  priority: Type.Optional(ArticlePrioritySchema),
  search: Type.Optional(Type.String({ maxLength: 200 })),
});

export const ArticleStatusCountsSchema = Type.Object({
  all: Type.Integer(),
  draft: Type.Integer(),
  published: Type.Integer(),
  archived: Type.Integer(),
});

/**
 * A preview is a draft as it stands in the form, so nothing is required: an
 * article with no headline yet can still be looked at.
 */
export const ArticlePreviewBodySchema = Type.Object(
  {
    categoryId: Type.Optional(NullableId),
    language: Type.Optional(LanguageSchema),
    headline: Type.Optional(Type.String({ maxLength: ARTICLE_HEADLINE_MAX })),
    summary: Type.Optional(Type.String({ maxLength: ARTICLE_SUMMARY_MAX })),
    content: Type.Optional(ArticleContentSchema),
    youtubeUrl: Type.Optional(
      Type.Union([Type.String({ maxLength: 2048 }), Type.Null()]),
    ),
    tags: Type.Optional(TagsSchema),
    featuredImageId: Type.Optional(NullableId),
    featuredImageLayout: Type.Optional(ImageLayoutSchema),
  },
  { additionalProperties: false },
);

export const ArticlePreviewSchema = Type.Object({
  token: Type.String(),
  expiresAt: IsoDateTime,
});

/** 32 random bytes, base64url: the length is fixed, so anything else is not one of ours. */
export const PreviewTokenParamsSchema = Type.Object({
  token: Type.String({ pattern: '^[A-Za-z0-9_-]{43}$' }),
});
