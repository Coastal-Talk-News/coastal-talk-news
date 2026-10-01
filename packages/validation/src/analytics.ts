import { Type } from '@sinclair/typebox';
import { UsageMeterSchema } from './dashboard.js';
import { IsoDateTime, paginationQueryFields } from './envelope.js';

export const AnalyticsStatsSchema = Type.Object({
  totalArticles: Type.Integer(),
  publishedToday: Type.Integer(),
  drafts: Type.Integer(),
  archived: Type.Integer(),
  activeBreakingNews: Type.Integer(),
  activeAdvertisements: Type.Integer(),
  totalViews: Type.Integer(),
});

export const AnalyticsArticleSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  status: Type.Union([
    Type.Literal('DRAFT'),
    Type.Literal('PUBLISHED'),
    Type.Literal('ARCHIVED'),
  ]),
  categoryName: Type.Union([Type.String(), Type.Null()]),
  publicationDate: Type.Union([IsoDateTime, Type.Null()]),
  readMinutes: Type.Integer(),
  viewCount: Type.Integer(),
});

export const AnalyticsArticlesQuerySchema = Type.Object({
  ...paginationQueryFields,
});

export const DatabaseTableUsageSchema = Type.Object({
  table: Type.String(),
  bytes: Type.Integer(),
  rowEstimate: Type.Integer(),
  percent: Type.Number(),
});

export const DatabaseStorageSchema = Type.Object({
  total: UsageMeterSchema,
  tables: Type.Array(DatabaseTableUsageSchema),
  otherBytes: Type.Integer(),
});
