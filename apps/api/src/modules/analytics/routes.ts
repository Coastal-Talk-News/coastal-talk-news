import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AnalyticsArticleSchema,
  AnalyticsArticlesQuerySchema,
  AnalyticsStatsSchema,
  ListResponse,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
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
    '/articles',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Every article with its read count, most read first',
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
