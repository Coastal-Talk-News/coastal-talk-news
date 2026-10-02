import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ListResponse,
  PublicAdvertisementDetailSchema,
  PublicAdvertisementParamsSchema,
  PublicArticleCardSchema,
  PublicArticleParamsSchema,
  PublicArticleSchema,
  PublicArticlesQuerySchema,
  PublicHomeQuerySchema,
  PublicHomeSchema,
  PublicPageParamsSchema,
  PublicPageQuerySchema,
  PublicPageSchema,
  PublicSearchQuerySchema,
  PublicSiteSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
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
          'Published articles only. Breaking news and advertisements are filtered by their schedule in SQL. `language` omitted means both languages, mixed together.',
        querystring: PublicHomeQuerySchema,
        response: {
          200: SuccessResponse(PublicHomeSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getHome,
  );

  app.get(
    '/pages/:page',
    {
      schema: {
        tags: ['public'],
        summary: 'Copy for a standalone page: About, Contact or Advertise',
        description:
          'Kept out of /site because the bodies are whole documents only their own page needs. Contact details fall back to the site-wide ones.',
        params: PublicPageParamsSchema,
        querystring: PublicPageQuerySchema,
        response: {
          200: SuccessResponse(PublicPageSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getPage,
  );

  app.get(
    '/search',
    {
      schema: {
        tags: ['public'],
        summary: 'Full-text search over published articles',
        description:
          'Ranked by relevance. `language` omitted means both languages, mixed together.',
        querystring: PublicSearchQuerySchema,
        response: {
          200: ListResponse(PublicArticleCardSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.search,
  );
};

export const publicArticleRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(import('@fastify/rate-limit'), { global: false });

  app.get(
    '',
    {
      schema: {
        tags: ['public'],
        summary: 'List published articles by editorial priority',
        description:
          'Backs the Lead Stories and Featured pages. `language` omitted means both languages, mixed together.',
        querystring: PublicArticlesQuerySchema,
        response: {
          200: ListResponse(PublicArticleCardSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.listArticlesByPriority,
  );

  app.post(
    '/:id/view',
    {
      schema: {
        tags: ['public'],
        summary: 'Count one read of a published article',
        description:
          'Sent by the reader site once a reader has stayed for half the read time. Anonymous: nothing about the reader is stored. An unknown or unpublished id is ignored rather than reported.',
        params: PublicArticleParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
      // A view is only a counter, but nothing else stops one client from
      // running it up.
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    controller.recordArticleView,
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['public'],
        summary: 'Get a published article, body included',
        description:
          'Draft and archived articles 404 rather than 403, so a stale shared link lands on the reader-site not-found page.',
        params: PublicArticleParamsSchema,
        response: {
          200: SuccessResponse(PublicArticleSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getArticle,
  );
};

export const publicAdvertisementRoutes: FastifyPluginAsyncTypebox = async (
  app,
) => {
  app.get(
    '/:id',
    {
      schema: {
        tags: ['public'],
        summary: "Get a running advertisement's own page",
        description:
          'Only while the ad is within its schedule: an expired or not-yet-started ad 404s, the same way an unpublished article does.',
        params: PublicAdvertisementParamsSchema,
        response: {
          200: SuccessResponse(PublicAdvertisementDetailSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getAdvertisement,
  );
};
