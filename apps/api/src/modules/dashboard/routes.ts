import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  DashboardSchema,
  DashboardUsageSchema,
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

  app.get(
    '/usage',
    {
      schema: {
        tags: ['dashboard'],
        summary:
          'Cloudinary credits and Supabase database size against their limits',
        description:
          'Kept apart from the overview because it calls Cloudinary. `cloudinary` is null when that call fails.',
        response: {
          200: SuccessResponse(DashboardUsageSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getUsage,
  );
};
