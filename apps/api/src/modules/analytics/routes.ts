import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AnalyticsArticleSchema,
  AnalyticsArticlesQuerySchema,
  AnalyticsDailyViewsSchema,
  AnalyticsMonthlyViewsQuerySchema,
  AnalyticsMonthlyViewsSchema,
  AnalyticsMonthViewsQuerySchema,
  AnalyticsStatsSchema,
  AnalyticsWeekViewsQuerySchema,
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
    '/views/week',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Reads per day of a calendar week (Monday to Sunday)',
        description:
          'Backs the detail view behind the "Week" card. weeksAgo=0 is the week containing today (stopping at today); 1 is the week before that, and so on.',
        querystring: AnalyticsWeekViewsQuerySchema,
        response: {
          200: SuccessResponse(Type.Array(AnalyticsDailyViewsSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.getWeekViews,
  );

  app.get(
    '/views/month',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Reads per day of the given calendar month',
        description:
          'Backs the detail view behind the "Month" card. For the current month this stops at today; a past month returns every day it had.',
        querystring: AnalyticsMonthViewsQuerySchema,
        response: {
          200: SuccessResponse(Type.Array(AnalyticsDailyViewsSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.getMonthViews,
  );

  app.get(
    '/views/monthly',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Reads per calendar month of the given year',
        description:
          'Backs the detail view behind the "Year" card. For the current year this stops at the current month, for the same reason.',
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
        summary:
          'The year range, and the earliest moment, with any recorded reads',
        description:
          'The earliest year with a read through the current year, plus the exact earliest timestamp, so Week/Month/Year navigation knows where to stop going further back.',
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
