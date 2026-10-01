import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ArticleParamsSchema,
  ArticlePreviewBodySchema,
  ArticleSchema,
  ArticleStatusCountsSchema,
  CmsArticleCountsQuerySchema,
  CmsArticleListQuerySchema,
  CreateArticleBodySchema,
  ListResponse,
  PublicArticleSchema,
  SuccessResponse,
  UpdateArticleBodySchema,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const cmsArticleRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(import('@fastify/rate-limit'), { global: false });
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['articles'],
        summary: 'List articles',
        querystring: CmsArticleListQuerySchema,
        response: {
          200: ListResponse(ArticleSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.listForCms,
  );

  // Declared before /:id so "counts" is not captured as an id.
  app.get(
    '/counts',
    {
      schema: {
        tags: ['articles'],
        summary: 'Count articles by status',
        description: 'Counts honor every list filter except status.',
        querystring: CmsArticleCountsQuerySchema,
        response: {
          200: SuccessResponse(ArticleStatusCountsSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.counts,
  );

  app.post(
    '/preview',
    {
      // Each call just reads the database to render the page - nothing is stored.
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: {
        tags: ['articles'],
        summary: 'Build a draft as the reader page',
        description:
          'Nothing is saved or stored server-side. Returns the built page directly; the CMS hands it to the preview tab itself.',
        body: ArticlePreviewBodySchema,
        response: {
          200: SuccessResponse(PublicArticleSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.preview,
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['articles'],
        summary: 'Get an article',
        params: ArticleParamsSchema,
        response: {
          200: SuccessResponse(ArticleSchema),
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
        tags: ['articles'],
        summary: 'Create an article',
        description:
          'No Scheduled status in V1 — omit status or set draft/published.',
        body: CreateArticleBodySchema,
        response: {
          201: SuccessResponse(ArticleSchema),
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
        tags: ['articles'],
        summary: 'Update an article',
        description: 'Also how an article is archived: set status=ARCHIVED.',
        params: ArticleParamsSchema,
        body: UpdateArticleBodySchema,
        response: {
          200: SuccessResponse(ArticleSchema),
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
        tags: ['articles'],
        summary: 'Delete an article',
        description:
          'Hard delete — removes the row. Prefer Archive to keep it.',
        params: ArticleParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.remove,
  );
};
