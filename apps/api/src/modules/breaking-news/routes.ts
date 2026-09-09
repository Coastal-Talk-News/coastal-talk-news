import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  BreakingNewsParamsSchema,
  BreakingNewsSchema,
  CmsBreakingNewsListQuerySchema,
  CreateBreakingNewsBodySchema,
  ListResponse,
  SuccessResponse,
  UpdateBreakingNewsBodySchema,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const cmsBreakingNewsRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['breaking-news'],
        summary: 'List breaking news items',
        querystring: CmsBreakingNewsListQuerySchema,
        response: {
          200: ListResponse(BreakingNewsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.listForCms,
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['breaking-news'],
        summary: 'Get a breaking news item',
        params: BreakingNewsParamsSchema,
        response: {
          200: SuccessResponse(BreakingNewsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getForCms,
  );

  app.post(
    '',
    {
      schema: {
        tags: ['breaking-news'],
        summary: 'Create a breaking news item',
        body: CreateBreakingNewsBodySchema,
        response: {
          201: SuccessResponse(BreakingNewsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.create,
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['breaking-news'],
        summary: 'Update a breaking news item',
        params: BreakingNewsParamsSchema,
        body: UpdateBreakingNewsBodySchema,
        response: {
          200: SuccessResponse(BreakingNewsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.update,
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['breaking-news'],
        summary: 'Delete a breaking news item',
        params: BreakingNewsParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.remove,
  );
};
