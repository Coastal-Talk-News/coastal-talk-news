import { Type } from '@sinclair/typebox';
import { IsoDateTime } from './envelope.js';
import { MediaSummarySchema } from './media.js';

const NullableMedia = Type.Union([MediaSummarySchema, Type.Null()]);

export const DashboardStatsSchema = Type.Object({
  totalArticles: Type.Integer(),
  publishedToday: Type.Integer(),
  activeBreakingNews: Type.Integer(),
  activeAdvertisements: Type.Integer(),
});

export const DashboardArticleSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  status: Type.Union([
    Type.Literal('DRAFT'),
    Type.Literal('PUBLISHED'),
    Type.Literal('ARCHIVED'),
  ]),
  categoryName: Type.Union([Type.String(), Type.Null()]),
  publicationDate: Type.Union([IsoDateTime, Type.Null()]),
  updatedAt: IsoDateTime,
  coverImage: NullableMedia,
});

export const DashboardBreakingNewsSchema = Type.Object({
  id: Type.String(),
  headline: Type.String(),
  startAt: IsoDateTime,
  endAt: Type.Union([IsoDateTime, Type.Null()]),
  isActive: Type.Boolean(),
});

export const DashboardAdvertisementSchema = Type.Object({
  id: Type.String(),
  advertiserName: Type.String(),
  startAt: IsoDateTime,
  endAt: IsoDateTime,
  isActive: Type.Boolean(),
  image: NullableMedia,
});

const UsageMeterSchema = Type.Object({
  used: Type.Number(),
  limit: Type.Number(),
  warnAt: Type.Number(),
});

export const DashboardUsageSchema = Type.Object({
  cloudinary: Type.Union([UsageMeterSchema, Type.Null()]),
  supabase: Type.Union([UsageMeterSchema, Type.Null()]),
});

export const DashboardSchema = Type.Object({
  stats: DashboardStatsSchema,
  recentArticles: Type.Array(DashboardArticleSchema),
  breakingNews: Type.Array(DashboardBreakingNewsSchema),
  advertisements: Type.Array(DashboardAdvertisementSchema),
});
