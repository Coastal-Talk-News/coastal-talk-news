import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  SiteSettingsSchema,
  SuccessResponse,
  UpdateSiteSettingsBodySchema,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const cmsSettingsRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['settings'],
        summary: 'Get site settings',
        response: {
          200: SuccessResponse(SiteSettingsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getForCms,
  );

  app.patch(
    '',
    {
      schema: {
        tags: ['settings'],
        summary: 'Update site settings',
        body: UpdateSiteSettingsBodySchema,
        response: {
          200: SuccessResponse(SiteSettingsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.update,
  );

  app.post(
    '/clear-article-cache',
    {
      schema: {
        tags: ['settings'],
        summary: 'Drop every cached reader-site article page immediately',
        response: {
          204: Type.Null(),
          ...commonErrorResponses,
        },
      },
    },
    controller.clearArticleCache,
  );
};
