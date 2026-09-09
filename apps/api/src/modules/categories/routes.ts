import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  CategoryParamsSchema,
  CategorySchema,
  CmsCategoryListQuerySchema,
  CmsCategorySchema,
  CreateCategoryBodySchema,
  ListResponse,
  PublicCategoryListQuerySchema,
  ReorderCategoriesBodySchema,
  SuccessResponse,
  UpdateCategoryBodySchema,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const cmsCategoryRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get(
    '',
    {
      schema: {
        tags: ['categories'],
        summary: 'List categories',
        querystring: CmsCategoryListQuerySchema,
        response: {
          200: ListResponse(CmsCategorySchema),
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
        tags: ['categories'],
        summary: 'Get a category',
        params: CategoryParamsSchema,
        response: {
          200: SuccessResponse(CmsCategorySchema),
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
        tags: ['categories'],
        summary: 'Create a category',
        body: CreateCategoryBodySchema,
        response: {
          201: SuccessResponse(CmsCategorySchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.create,
  );

  // Declared before /:id so "order" is not captured as an id.
  app.patch(
    '/order',
    {
      schema: {
        tags: ['categories'],
        summary: 'Reorder categories',
        description:
          'Takes every category id in display order. Applied in one transaction.',
        body: ReorderCategoriesBodySchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.reorder,
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Update a category',
        params: CategoryParamsSchema,
        body: UpdateCategoryBodySchema,
        response: {
          200: SuccessResponse(CmsCategorySchema),
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
        tags: ['categories'],
        summary: 'Delete a category',
        description:
          'Rejected with 409 while any article still references this category.',
        params: CategoryParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.remove,
  );
};

export const publicCategoryRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '',
    {
      schema: {
        tags: ['categories'],
        summary: 'List active categories in display order',
        querystring: PublicCategoryListQuerySchema,
        response: {
          200: ListResponse(CategorySchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.listPublic,
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Get an active category',
        params: CategoryParamsSchema,
        response: {
          200: SuccessResponse(CategorySchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getPublic,
  );
};
