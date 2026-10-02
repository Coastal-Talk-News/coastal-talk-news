import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ListResponse,
  SeoArticleIssueSchema,
  SeoArticlesQuerySchema,
  SeoHealthSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import * as controller from './controller.js';

export const seoRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['seo'],
        summary:
          'What published articles and active categories are missing for search',
        description:
          'Facts from the database only, no score. A missing SEO title or description falls back to the headline and summary on the reader site.',
        response: {
          200: SuccessResponse(SeoHealthSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getHealth,
  );

  app.get(
    '/articles',
    {
      schema: {
        tags: ['seo'],
        summary: 'Published articles missing an SEO field, a page at a time',
        description:
          'Most recently published first. An article is listed while it lacks any of: SEO title, meta description, URL slug, featured image.',
        querystring: SeoArticlesQuerySchema,
        response: {
          200: ListResponse(SeoArticleIssueSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.listArticleIssues,
  );
};
