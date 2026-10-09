import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';
import { BREAKING_NEWS_HEADLINE_MAX } from './limits.js';

export { BREAKING_NEWS_HEADLINE_MAX };

const RELATED_LINK_PATTERN = '^[A-Za-z][A-Za-z0-9+.-]*:[^\\s]+$';
const RelatedLinkSchema = Type.Optional(
  Type.Union([
    Type.String({ maxLength: 2048, pattern: RELATED_LINK_PATTERN }),
    Type.Literal(''),
  ]),
);

export const BreakingNewsSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  headlineKannada: Type.Union([Type.String(), Type.Null()]),
  articleUrl: Type.String(),
  articleUrlKannada: Type.String(),
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
    // Empty strings clear a saved link while absolute URLs support Unicode
    // paths such as Kannada article slugs.
    articleUrl: RelatedLinkSchema,
    articleUrlKannada: RelatedLinkSchema,
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
