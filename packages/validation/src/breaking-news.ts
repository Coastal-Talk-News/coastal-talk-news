import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { BREAKING_NEWS_HEADLINE_MAX } from './limits.js';

export { BREAKING_NEWS_HEADLINE_MAX };

export const BreakingNewsSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  headlineKannada: Type.Union([Type.String(), Type.Null()]),
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
    headlineKannada: Type.String({
      minLength: 1,
      maxLength: BREAKING_NEWS_HEADLINE_MAX,
    }),
    // '' is how "no link" is stored, so it has to be accepted alongside a
    // real URL — otherwise a cleared link fails the uri check and there is no
    // way to remove a link once it has been saved.
    articleUrl: Type.Optional(
      Type.Union([
        Type.String({ maxLength: 2048, format: 'uri' }),
        Type.Literal(''),
      ]),
    ),
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
