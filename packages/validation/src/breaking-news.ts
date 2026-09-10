import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';

export const BREAKING_NEWS_HEADLINE_MAX = 150;

export const BreakingNewsSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  articleUrl: Type.String(),
  startAt: IsoDateTime,
  endAt: Type.Union([IsoDateTime, Type.Null()]),
  isActive: Type.Boolean(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});

export const CreateBreakingNewsBodySchema = Type.Object(
  {
    headline: Type.String({
      minLength: 1,
      maxLength: BREAKING_NEWS_HEADLINE_MAX,
    }),
    // Omit for no link. Empty string is not accepted — omit the key instead.
    articleUrl: Type.Optional(Type.String({ maxLength: 2048, format: 'uri' })),
    startAt: IsoDateTime,
    // Omit or null to run indefinitely from startAt until deleted.
    endAt: Type.Optional(Type.Union([IsoDateTime, Type.Null()])),
  },
  { additionalProperties: false },
);

export const UpdateBreakingNewsBodySchema = Type.Partial(
  CreateBreakingNewsBodySchema,
  {
    // Rejects an empty PATCH rather than reporting success for a no-op.
    minProperties: 1,
    additionalProperties: false,
  },
);

export const BreakingNewsParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const CmsBreakingNewsListQuerySchema = Type.Object({
  ...paginationQueryFields,
});
