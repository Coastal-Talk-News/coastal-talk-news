import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
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
