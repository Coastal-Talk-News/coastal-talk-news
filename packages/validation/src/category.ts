import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { MediaSummarySchema } from './media.js';

export const CATEGORY_NAME_MAX = 60;
export const CATEGORY_DESCRIPTION_MAX = 500;

const categoryFields = {
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  isActive: Type.Boolean(),
  displayOrder: Type.Integer(),
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
    // Omit to append to the end of the list.
    displayOrder: Type.Optional(Type.Integer({ minimum: 0 })),
    coverImageId: Type.Optional(NullableId),
  },
  { additionalProperties: false },
);

export const UpdateCategoryBodySchema = Type.Partial(CreateCategoryBodySchema, {
  // Rejects an empty PATCH rather than reporting success for a no-op.
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

export const ReorderCategoriesBodySchema = Type.Object(
  {
    /** Every category id, in the order they should appear. */
    ids: Type.Array(Type.String({ format: 'uuid' }), { minItems: 1 }),
  },
  { additionalProperties: false },
);
