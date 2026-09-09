import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  CmsUserSchema,
  LoginBodySchema,
  RevokedCountSchema,
  SessionParamsSchema,
  SessionSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import * as controller from './controller.js';

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  // global:false so the limit applies only where opted in. Covering the whole
  // plugin would also throttle /me, which the CMS calls on every page load.
  await app.register(import('@fastify/rate-limit'), { global: false });

  app.post(
    '/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
      schema: {
        tags: ['auth'],
        summary: 'Log in to the CMS',
        body: LoginBodySchema,
        response: {
          200: SuccessResponse(CmsUserSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.login,
  );

  app.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Log out and revoke the current session',
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.logout,
  );

  app.get(
    '/me',
    {
      preHandler: app.requireAuth,
      schema: {
        tags: ['auth'],
        summary: 'Current CMS user',
        response: {
          200: SuccessResponse(CmsUserSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.me,
  );

  app.get(
    '/sessions',
    {
      preHandler: app.requireAuth,
      schema: {
        tags: ['auth'],
        summary: 'List your active sessions',
        description:
          'Sessions are held in the API process, so a restart or deploy ends all of them.',
        response: {
          200: SuccessResponse(Type.Array(SessionSchema)),
          ...commonErrorResponses,
        },
      },
    },
    controller.listSessions,
  );

  app.delete(
    '/sessions/others',
    {
      preHandler: app.requireAuth,
      schema: {
        tags: ['auth'],
        summary: 'Revoke every session except the current one',
        response: {
          200: SuccessResponse(RevokedCountSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.revokeOtherSessions,
  );

  // Declared after /sessions/others so "others" is not captured as an id.
  app.delete(
    '/sessions/:id',
    {
      preHandler: app.requireAuth,
      schema: {
        tags: ['auth'],
        summary: 'Revoke one session',
        params: SessionParamsSchema,
        response: { 204: Type.Null(), ...commonErrorResponses },
      },
    },
    controller.revokeSession,
  );
};
