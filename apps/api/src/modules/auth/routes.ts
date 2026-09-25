import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ChangePasswordBodySchema,
  CmsUserSchema,
  LoginBodySchema,
  PasswordChangedSchema,
  RevokedCountSchema,
  SessionParamsSchema,
  SessionSchema,
  SuccessResponse,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { Type } from '@sinclair/typebox';
import { requireStringFields } from '../../lib/request-guards.js';
import * as controller from './controller.js';

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
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

  app.post(
    '/change-password',
    {
      preValidation: requireStringFields('currentPassword', 'newPassword'),
      preHandler: app.requireAuth,
      config: {
        // Per user, not per IP, and after requireAuth so there is a user to
        // key on: someone holding a stolen session must not get unlimited
        // guesses at the current password from a spread of addresses.
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          hook: 'preHandler',
          keyGenerator: (request) => request.session.userId,
        },
      },
      schema: {
        tags: ['auth'],
        summary: 'Change your password',
        description:
          'Requires the current password. Signs out every other device and issues this one a new session.',
        body: ChangePasswordBodySchema,
        response: {
          200: SuccessResponse(PasswordChangedSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.changePassword,
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
