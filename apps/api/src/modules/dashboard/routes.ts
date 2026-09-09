import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  DashboardSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import * as controller from './controller.js';

export const dashboardRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['dashboard'],
        summary: 'Newsroom overview counts and recent activity',
        response: {
          200: SuccessResponse(DashboardSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getDashboard,
  );
};
