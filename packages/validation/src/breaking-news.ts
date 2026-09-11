import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { BREAKING_NEWS_HEADLINE_MAX } from './limits.js';

export { BREAKING_NEWS_HEADLINE_MAX };

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
    articleUrl: Type.Optional(Type.String({ maxLength: 2048, format: 'uri' })),
    startAt: IsoDateTime,
    endAt: Type.Optional(Type.Union([IsoDateTime, Type.Null()])),
  },
  { additionalProperties: false },
);

export const UpdateBreakingNewsBodySchema = Type.Partial(
  CreateBreakingNewsBodySchema,
  {
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
