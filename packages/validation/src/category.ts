import { Type } from '@sinclair/typebox';
import { LanguageSchema } from './article.js';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';
import { CATEGORY_NAME_MAX, CATEGORY_DESCRIPTION_MAX } from './limits.js';

export { CATEGORY_NAME_MAX, CATEGORY_DESCRIPTION_MAX };

const categoryFields = {
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  isActive: Type.Boolean(),
  displayOrder: Type.Integer(),
  parentId: Type.Union([Type.String(), Type.Null()]),
  coverImage: Type.Union([MediaSummarySchema, Type.Null()]),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
};

export const CategorySchema = Type.Object(categoryFields);

export const CmsCategorySchema = Type.Object({
  ...categoryFields,
  articleCount: Type.Integer(),
});

const NullableId = Type.Union([Type.String({ format: 'uuid' }), Type.Null()]);

export const CreateCategoryBodySchema = Type.Object(
  {
    name: Type.String({ minLength: 1, maxLength: CATEGORY_NAME_MAX }),
    description: Type.Optional(
      Type.Union([
        Type.String({ maxLength: CATEGORY_DESCRIPTION_MAX }),
        Type.Null(),
      ]),
    ),
    isActive: Type.Optional(Type.Boolean()),
    displayOrder: Type.Optional(Type.Integer({ minimum: 0 })),
    parentId: Type.Optional(NullableId),
    coverImageId: Type.Optional(NullableId),
  },
  { additionalProperties: false },
);

export const UpdateCategoryBodySchema = Type.Partial(CreateCategoryBodySchema, {
  minProperties: 1,
  additionalProperties: false,
});

export const CategoryParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const CmsCategoryListQuerySchema = Type.Object({
  ...paginationQueryFields,
  isActive: Type.Optional(Type.Boolean()),
});

export const PublicCategoryListQuerySchema = Type.Object({
  ...paginationQueryFields,
});

export const PublicCategoryArticlesQuerySchema = Type.Object({
  ...paginationQueryFields,
  // Omitted entirely means both languages, mixed together.
  language: Type.Optional(LanguageSchema),
});

export const ReorderCategoriesBodySchema = Type.Object(
  {
    parentId: NullableId,
    ids: Type.Array(Type.String({ format: 'uuid' }), { minItems: 1 }),
  },
  { additionalProperties: false },
);
