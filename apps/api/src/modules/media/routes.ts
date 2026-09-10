import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  CleanupResultSchema,
  ListResponse,
  MediaAssetSchema,
  MediaListQuerySchema,
  MediaParamsSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const mediaRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['media'],
        summary: 'List media assets, newest first',
        querystring: MediaListQuerySchema,
        response: {
          200: ListResponse(MediaAssetSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.list,
  );

  app.post(
    '',
    {
      schema: {
        tags: ['media'],
        summary: 'Upload one or more images',
        consumes: ['multipart/form-data'],
        response: {
          201: SuccessResponse(Type.Array(MediaAssetSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.upload,
  );

  // Declared before /:id so "cleanup" is not captured as an id.
  app.post(
    '/cleanup',
    {
      schema: {
        tags: ['media'],
        summary: 'Delete every asset nothing references',
        response: {
          200: SuccessResponse(CleanupResultSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.cleanup,
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['media'],
        summary: 'Get one asset with its usage',
        params: MediaParamsSchema,
        response: {
          200: SuccessResponse(MediaAssetSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getById,
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['media'],
        summary: 'Delete an asset',
        description: 'Rejected with 409 while anything still references it.',
        params: MediaParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.remove,
  );
};
