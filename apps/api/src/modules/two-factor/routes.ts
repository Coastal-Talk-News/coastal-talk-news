import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AuthenticatorResetSchema,
  RecoveryCodesSchema,
  SuccessResponse,
  TwoFactorCodeBodySchema,
  TwoFactorEnrolledSchema,
  TwoFactorEnrollmentSchema,
  TwoFactorReauthBodySchema,
  TwoFactorSignInSchema,
  TwoFactorStatusSchema,
  commonErrorResponses,
} from '@coastal-talk-news/validation';
import { requireStringFields } from '../../lib/request-guards.js';
import * as controller from './controller.js';

/** Guessing a code is capped per pending sign-in and per account as well; this
 *  is the outer wall, per address. */
const CODE_RATE_LIMIT = { max: 20, timeWindow: '15 minutes' };

/** Re-proving with a password is a guessing surface too, so it is limited per
 *  signed-in user rather than per address. */
const REAUTH_RATE_LIMIT = {
  max: 5,
  timeWindow: '15 minutes',
  hook: 'preHandler' as const,
  keyGenerator: (request: { session: { userId: string } }) =>
    request.session.userId,
};

export const twoFactorRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(import('@fastify/rate-limit'), { global: false });

  // Secrets and recovery codes travel through here; none of it may be cached
  // by the browser or anything between it and the API.
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  /* Before there is a session */

  app.post(
    '/setup',
    {
      preHandler: app.requireChallenge('setup'),
      config: { rateLimit: CODE_RATE_LIMIT },
      schema: {
        tags: ['two-factor'],
        summary: 'Start setting up two-factor during sign-in',
        description:
          'Returns the secret and QR payload for an authenticator app. Nothing is saved until a code from it is confirmed.',
        response: {
          200: SuccessResponse(TwoFactorEnrollmentSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.beginSetup,
  );

  app.post(
    '/setup/confirm',
    {
      preValidation: requireStringFields('code'),
      preHandler: app.requireChallenge('setup'),
      config: { rateLimit: CODE_RATE_LIMIT },
      schema: {
        tags: ['two-factor'],
        summary: 'Confirm the authenticator and finish signing in',
        description:
          'Saves the authenticator, returns the recovery codes (shown once) and opens the session.',
        body: TwoFactorCodeBodySchema,
        response: {
          200: SuccessResponse(TwoFactorEnrolledSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.confirmSetup,
  );

  app.post(
    '/verify',
    {
      preValidation: requireStringFields('code'),
      preHandler: app.requireChallenge('verify'),
      config: { rateLimit: CODE_RATE_LIMIT },
      schema: {
        tags: ['two-factor'],
        summary: 'Give the second factor and finish signing in',
        description:
          'Accepts an authenticator code or a recovery code, and opens the session.',
        body: TwoFactorCodeBodySchema,
        response: {
          200: SuccessResponse(TwoFactorSignInSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.verifySignIn,
  );

  /* With a session */

  app.get(
    '/',
    {
      preHandler: app.requireAuth,
      schema: {
        tags: ['two-factor'],
        summary: 'Two-factor status for the signed-in user',
        response: {
          200: SuccessResponse(TwoFactorStatusSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.getStatus,
  );

  app.post(
    '/recovery-codes',
    {
      preValidation: requireStringFields('password', 'code'),
      preHandler: app.requireAuth,
      config: { rateLimit: REAUTH_RATE_LIMIT },
      schema: {
        tags: ['two-factor'],
        summary: 'Replace the recovery codes',
        description:
          'Needs the password and a current code. The old codes stop working.',
        body: TwoFactorReauthBodySchema,
        response: {
          200: SuccessResponse(RecoveryCodesSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.regenerateRecoveryCodes,
  );

  app.post(
    '/reset',
    {
      preValidation: requireStringFields('password', 'code'),
      preHandler: app.requireAuth,
      config: { rateLimit: REAUTH_RATE_LIMIT },
      schema: {
        tags: ['two-factor'],
        summary: 'Start moving to a new authenticator',
        description:
          'Needs the password and a current code. Returns a new secret; the old one keeps working until the new one is confirmed.',
        body: TwoFactorReauthBodySchema,
        response: {
          200: SuccessResponse(TwoFactorEnrollmentSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.beginReset,
  );

  app.post(
    '/reset/confirm',
    {
      preValidation: requireStringFields('code'),
      preHandler: app.requireAuth,
      config: { rateLimit: CODE_RATE_LIMIT },
      schema: {
        tags: ['two-factor'],
        summary: 'Confirm the new authenticator',
        description:
          'Replaces the authenticator and the recovery codes, and signs out every other device.',
        body: TwoFactorCodeBodySchema,
        response: {
          200: SuccessResponse(AuthenticatorResetSchema),
          ...commonErrorResponses,
        },
      },
    },
    controller.confirmReset,
  );
};
