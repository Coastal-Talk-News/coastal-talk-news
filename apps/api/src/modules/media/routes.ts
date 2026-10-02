import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  CleanupResultSchema,
  ListResponse,
  MediaAssetSchema,
  MediaListQuerySchema,
  MediaParamsSchema,
  MediaUploadSignatureSchema,
  RegisterMediaBodySchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const mediaRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(import('@fastify/rate-limit'), { global: false });
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
    '/signature',
    {
      // Minting a signature is cheap, but each one doubles as an invite to
      // spend an upload against this Cloudinary account.
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        tags: ['media'],
        summary:
          'Get a signed ticket to upload one image straight to Cloudinary',
        description:
          'Nothing is stored yet. The browser uploads directly to Cloudinary with this, then calls POST / with the result to register it.',
        response: {
          200: SuccessResponse(MediaUploadSignatureSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getUploadSignature,
  );

  app.post(
    '',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        tags: ['media'],
        summary: 'Register an image already uploaded to Cloudinary',
        description:
          'The upload itself happens directly between the browser and Cloudinary. This confirms it actually happened by reading the asset back from Cloudinary - format, dimensions, byte size - rather than trusting the request, then records it.',
        body: RegisterMediaBodySchema,
        response: {
          201: SuccessResponse(MediaAssetSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.registerUpload,
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
