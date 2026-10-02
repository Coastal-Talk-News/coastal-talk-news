import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  CleanupResultSchema,
  ListResponse,
  MediaAssetSchema,
  MediaListQuerySchema,
  MediaParamsSchema,
  MediaUploadTicketSchema,
  RegisterMediaBodySchema,
  SuccessResponse,
  UploadSignatureBodySchema,
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
      // Minting a ticket is cheap, but each one doubles as an invite to
      // spend an upload against this storage account.
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        tags: ['media'],
        summary: 'Get a signed ticket to upload one image straight to storage',
        description:
          'Nothing is stored yet. The browser uploads directly to whichever backend STORAGE_PROVIDER selects with this, then calls POST / with the result to register it.',
        body: UploadSignatureBodySchema,
        response: {
          200: SuccessResponse(MediaUploadTicketSchema),
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
        summary: 'Register an image already uploaded to storage',
        description:
          'The upload itself happens directly between the browser and storage. This confirms it actually happened by reading the asset back from the storage backend - format and byte size always, dimensions where the backend can report them - rather than trusting the request, then records it.',
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
