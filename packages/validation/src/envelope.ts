import { Type, type TSchema } from '@sinclair/typebox';

export const IsoDateTime = Type.String({
  format: 'date-time',
  description: 'ISO 8601 timestamp',
});

export const PaginationMetaSchema = Type.Object({
  page: Type.Integer({ minimum: 1 }),
  limit: Type.Integer({ minimum: 1 }),
  total: Type.Integer({ minimum: 0 }),
  totalPages: Type.Integer({ minimum: 0 }),
  hasNextPage: Type.Boolean(),
  hasPreviousPage: Type.Boolean(),
});

export function SuccessResponse<T extends TSchema>(data: T) {
  return Type.Object({
    success: Type.Literal(true),
    data,
  });
}

export function ListResponse<T extends TSchema>(item: T) {
  return Type.Object({
    success: Type.Literal(true),
    data: Type.Array(item),
    meta: PaginationMetaSchema,
  });
}

export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
    details: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  }),
});

export const commonErrorResponses = {
  400: ErrorResponseSchema,
  401: ErrorResponseSchema,
  404: ErrorResponseSchema,
  409: ErrorResponseSchema,
  500: ErrorResponseSchema,
  503: ErrorResponseSchema,
};

export const paginationQueryFields = {
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
};
