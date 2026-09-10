import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';

export const ARTICLE_HEADLINE_MAX = 200;
export const ARTICLE_SUMMARY_MAX = 300;
export const ARTICLE_SEO_TITLE_MAX = 70;
export const ARTICLE_META_DESCRIPTION_MAX = 300;
export const ARTICLE_TAG_MAX = 40;
export const ARTICLE_TAGS_MAX = 10;

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

/** No Scheduled status in V1 — creating an article publishes it immediately or saves a draft. */
export const CreatableArticleStatusSchema = Type.Union([
  Type.Literal('DRAFT'),
  Type.Literal('PUBLISHED'),
]);

/**
 * A light shape check, not a full ProseMirror schema — the API stores this
 * opaquely and only reads text out of it (lib/tiptap-text.ts) to build
 * contentText. Rejecting non-doc-shaped JSON here is enough to catch garbage
 * without hand-maintaining every Tiptap node type.
 */
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
  // Nullable at the DB level (see schema.prisma's Article.categoryId comment)
  // — the API still requires a category on create.
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
  ogImage: Type.Union([MediaSummarySchema, Type.Null()]),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
};

export const ArticleSchema = Type.Object(articleFields);

/** Shared shape for the writable fields, before Create/Update apply different optionality. */
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
    // Omit or DRAFT/PUBLISHED — Archive is reached via update, not creation.
    status: Type.Optional(CreatableArticleStatusSchema),
    featuredImageId: Type.Optional(writableArticleFields.featuredImageId),
    ogImageId: Type.Optional(writableArticleFields.ogImageId),
    seoTitle: Type.Optional(writableArticleFields.seoTitle),
    metaDescription: Type.Optional(writableArticleFields.metaDescription),
  },
  { additionalProperties: false },
);

export const UpdateArticleBodySchema = Type.Partial(
  Type.Object({ ...writableArticleFields, status: ArticleStatusSchema }),
  {
    // Rejects an empty PATCH rather than reporting success for a no-op.
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
  // Matched against headline and content, case-insensitive.
  search: Type.Optional(Type.String({ maxLength: 200 })),
  sort: Type.Optional(ArticleSortSchema),
});

/** Every CmsArticleListQuerySchema filter except status and pagination. */
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
