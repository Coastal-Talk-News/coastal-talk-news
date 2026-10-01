import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AnalyticsArticleSchema,
  AnalyticsArticlesQuerySchema,
  AnalyticsDailyViewsSchema,
  AnalyticsMonthlyViewsQuerySchema,
  AnalyticsMonthlyViewsSchema,
  AnalyticsStatsSchema,
  AnalyticsWeeklyViewsSchema,
  AnalyticsYearRangeSchema,
  DatabaseStorageSchema,
  ListResponse,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const analyticsRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Newsroom counts and total reads',
        response: {
          200: SuccessResponse(AnalyticsStatsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getStats,
  );

  app.get(
    '/storage',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Database size broken down by table',
        response: {
          200: SuccessResponse(DatabaseStorageSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getStorage,
  );

  app.get(
    '/views/daily',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Reads per day for the trailing 7 days',
        description: 'Backs the detail view behind the "Views This Week" card.',
        response: {
          200: SuccessResponse(Type.Array(AnalyticsDailyViewsSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.getDailyViews,
  );

  app.get(
    '/views/weekly',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Reads per 7-day span for the trailing 30 days',
        description:
          'Backs the detail view behind the "Views This Month" card. The oldest span is shorter than 7 days, since 30 does not divide evenly by 7.',
        response: {
          200: SuccessResponse(Type.Array(AnalyticsWeeklyViewsSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.getWeeklyViews,
  );

  app.get(
    '/views/monthly',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Reads per calendar month of the given year',
        description: 'Backs the detail view behind the "Views This Year" card.',
        querystring: AnalyticsMonthlyViewsQuerySchema,
        response: {
          200: SuccessResponse(Type.Array(AnalyticsMonthlyViewsSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.getMonthlyViews,
  );

  app.get(
    '/views/years',
    {
      schema: {
        tags: ['analytics'],
        summary: 'The year range with any recorded reads',
        description:
          'The earliest year with a read through the current year, for the year picker next to the monthly detail view.',
        response: {
          200: SuccessResponse(AnalyticsYearRangeSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getYearRange,
  );

  app.get(
    '/articles',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Every article with its view count',
        description:
          'Sorted by views (default), publication date or category; within a category, or among equal dates, most viewed first.',
        querystring: AnalyticsArticlesQuerySchema,
        response: {
          200: ListResponse(AnalyticsArticleSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.listArticles,
  );
};
