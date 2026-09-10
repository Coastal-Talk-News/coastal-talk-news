import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AdvertisementParamsSchema,
  AdvertisementSchema,
  CmsAdvertisementListQuerySchema,
  CreateAdvertisementBodySchema,
  ListResponse,
  SuccessResponse,
  UpdateAdvertisementBodySchema,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const cmsAdvertisementRoutes: FastifyPluginAsyncTypebox = async (
  app,
) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['advertisements'],
        summary: 'List advertisements',
        querystring: CmsAdvertisementListQuerySchema,
        response: {
          200: ListResponse(AdvertisementSchema),
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
        tags: ['advertisements'],
        summary: 'Get an advertisement',
        params: AdvertisementParamsSchema,
        response: {
          200: SuccessResponse(AdvertisementSchema),
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
        tags: ['advertisements'],
        summary: 'Create an advertisement',
        body: CreateAdvertisementBodySchema,
        response: {
          201: SuccessResponse(AdvertisementSchema),
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
        tags: ['advertisements'],
        summary: 'Update an advertisement',
        params: AdvertisementParamsSchema,
        body: UpdateAdvertisementBodySchema,
        response: {
          200: SuccessResponse(AdvertisementSchema),
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
        tags: ['advertisements'],
        summary: 'Delete an advertisement',
        params: AdvertisementParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.remove,
  );
};
