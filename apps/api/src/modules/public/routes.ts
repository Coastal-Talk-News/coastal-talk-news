import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  PublicArticleParamsSchema,
  PublicArticleSchema,
  PublicHomeSchema,
  PublicSiteSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import * as controller from './controller.js';

export const publicSiteRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/site',
    {
      schema: {
        tags: ['public'],
        summary:
          'Site chrome: settings, navigation categories and live breaking news',
        response: {
          200: SuccessResponse(PublicSiteSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getSite,
  );

  app.get(
    '/home',
    {
      schema: {
        tags: ['public'],
        summary: 'Everything the homepage renders, in one call',
        description:
          'Published articles only. Breaking news and advertisements are filtered by their schedule in SQL.',
        response: {
          200: SuccessResponse(PublicHomeSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getHome,
  );
};

export const publicArticleRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/:id',
    {
      schema: {
        tags: ['public'],
        summary: 'Get a published article, body included',
        description:
          'Draft and archived articles 404 rather than 403, so a stale shared link lands on the reader-site not-found page.',
        params: PublicArticleParamsSchema,
        response: {
          200: SuccessResponse(PublicArticleSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getArticle,
  );
};
