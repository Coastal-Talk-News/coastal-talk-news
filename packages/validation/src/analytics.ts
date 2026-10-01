import { Type } from '@sinclair/typebox';
import { IsoDateTime, paginationQueryFields } from './envelope.js';

export const AnalyticsStatsSchema = Type.Object({
  totalArticles: Type.Integer(),
  publishedToday: Type.Integer(),
  drafts: Type.Integer(),
  archived: Type.Integer(),
  activeBreakingNews: Type.Integer(),
  activeAdvertisements: Type.Integer(),
  viewsToday: Type.Integer(),
  viewsThisWeek: Type.Integer(),
  viewsThisMonth: Type.Integer(),
  viewsThisYear: Type.Integer(),
});

export const AnalyticsDailyViewsSchema = Type.Object({
  date: IsoDateTime,
  views: Type.Integer(),
});

export const AnalyticsWeeklyViewsSchema = Type.Object({
  from: IsoDateTime,
  to: IsoDateTime,
  views: Type.Integer(),
});

export const AnalyticsMonthlyViewsSchema = Type.Object({
  month: Type.Integer({ minimum: 1, maximum: 12 }),
  views: Type.Integer(),
});

export const AnalyticsMonthlyViewsQuerySchema = Type.Object({
  year: Type.Integer({ minimum: 2000, maximum: 2100 }),
});

export const AnalyticsYearRangeSchema = Type.Object({
  minYear: Type.Integer(),
  maxYear: Type.Integer(),
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
  // Within a category, or among equal dates, articles are always most read first.
  sort: Type.Union(
    [
      Type.Literal('views'),
      Type.Literal('published'),
      Type.Literal('category'),
    ],
    { default: 'views' },
  ),
  order: Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
    default: 'desc',
  }),
});
