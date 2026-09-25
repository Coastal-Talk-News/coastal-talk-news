import type {
  TwoFactorCodeRequest,
  TwoFactorReauthRequest,
} from '@coastal-talk-news/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  BadRequestError,
  InvalidTwoFactorCodeError,
  SignInExpiredError,
  TwoFactorSetupExpiredError,
  UnauthorizedError,
} from '../../lib/errors.js';
import { dataEnvelope } from '../../lib/pagination.js';
import type { Challenge } from '../auth/challenge-store.js';
import * as authRepository from '../auth/repository.js';
import * as authService from '../auth/service.js';
import * as service from './service.js';

function depsOf(request: FastifyRequest): service.TwoFactorDeps {
  const { prisma, secretBox, challenges } = request.server;
  return { db: prisma, box: secretBox, challenges };
}

/**
 * Runs a step that checks a code, counting a wrong one against the pending
 * entry it was typed into. After a handful the entry is destroyed, so guessing
 * a six-digit code means starting over - with the password - every few tries.
 */
async function countingAttempts<T>(
  request: FastifyRequest,
  challenge: Challenge,
  work: () => Promise<T>,
  whenExhausted: () => Error,
): Promise<T> {
  const { challenges } = request.server;
  try {
    return await work();
  } catch (error) {
    if (error instanceof InvalidTwoFactorCodeError) {
      if (challenges.fail(challenge.key) === 'exhausted') {
        throw whenExhausted();
      }
      throw new InvalidTwoFactorCodeError(error.message, {
        attemptsLeft: challenges.attemptsLeft(challenge.key),
      });
    }
    throw error;
  }
}

/** The session is only ever issued here, once the second step has succeeded. */
async function completeSignIn(
  request: FastifyRequest,
  reply: FastifyReply,
  userId: string,
) {
  request.server.clearChallenge(request, reply);
  request.server.issueSession(request, reply, userId);
  return authService.getCurrentUser(request.server.prisma, userId);
}

/* ---- Before there is a session: the step a sign-in owes ---- */

export async function beginSetup(request: FastifyRequest) {
  const { challenge } = request;
  const user = await authRepository.findPublicById(
    request.server.prisma,
    challenge.userId,
  );
  if (!user) throw new SignInExpiredError();

  // Asked twice (a reload, the back button) it answers with the same secret,
  // so a code already added to an authenticator app keeps working.
  const enrollment = service.beginEnrollment(user.email, challenge.secret);
  challenge.secret = enrollment.secret;
  return dataEnvelope(enrollment);
}

export async function confirmSetup(
  request: FastifyRequest<{ Body: TwoFactorCodeRequest }>,
  reply: FastifyReply,
) {
  const { challenge } = request;
  if (!challenge.secret) {
    throw new BadRequestError('Scan the QR code before entering a code.');
  }
  const { secret } = challenge;

  const recoveryCodes = await countingAttempts(
    request,
    challenge,
    () =>
      service.saveEnrollment(
        depsOf(request),
        challenge.userId,
        secret,
        request.body.code,
        { replacing: false },
      ),
    () => exhaustedSignIn(request, reply),
  );

  const user = await completeSignIn(request, reply, challenge.userId);
  request.log.info({ userId: user.id }, 'Two-factor authentication enabled');
  return dataEnvelope({ user, recoveryCodes });
}

export async function verifySignIn(
  request: FastifyRequest<{ Body: TwoFactorCodeRequest }>,
  reply: FastifyReply,
) {
  const { challenge } = request;

  const { method, recoveryCodesRemaining } = await countingAttempts(
    request,
    challenge,
    () =>
      service.verifySecondFactor(
        depsOf(request),
        challenge.userId,
        request.body.code,
      ),
    () => exhaustedSignIn(request, reply),
  );

  const user = await completeSignIn(request, reply, challenge.userId);
  if (method === 'recovery') {
    request.log.warn(
      { userId: user.id, recoveryCodesRemaining },
      'Signed in with a recovery code',
    );
  }
  return dataEnvelope({
    user,
    usedRecoveryCode: method === 'recovery',
    recoveryCodesRemaining,
  });
}

function exhaustedSignIn(request: FastifyRequest, reply: FastifyReply): Error {
  request.server.clearChallenge(request, reply);
  request.log.warn(
    { userId: request.challenge.userId },
    'Sign-in abandoned after too many incorrect codes',
  );
  return new SignInExpiredError('Too many incorrect codes. Sign in again.');
}

/* ---- With a session: looking after two-factor afterwards ---- */

export async function getStatus(request: FastifyRequest) {
  return dataEnvelope(
    await service.getStatus(depsOf(request), request.session.userId),
  );
}

export async function regenerateRecoveryCodes(
  request: FastifyRequest<{ Body: TwoFactorReauthRequest }>,
) {
  const { userId } = request.session;
  const deps = depsOf(request);
  await service.reauthenticate(
    deps,
    userId,
    request.body.password,
    request.body.code,
  );

  const recoveryCodes = await service.regenerateRecoveryCodes(deps, userId);
  request.log.info({ userId }, 'Recovery codes regenerated');
  return dataEnvelope({ recoveryCodes });
}

export async function beginReset(
  request: FastifyRequest<{ Body: TwoFactorReauthRequest }>,
) {
  const { userId, id: sessionId } = request.session;
  await service.reauthenticate(
    depsOf(request),
    userId,
    request.body.password,
    request.body.code,
  );

  const user = await authRepository.findPublicById(
    request.server.prisma,
    userId,
  );
  if (!user) throw new UnauthorizedError();

  const enrollment = service.beginEnrollment(user.email);
  request.server.challenges.startReset(sessionId, userId, enrollment.secret);
  return dataEnvelope(enrollment);
}

export async function confirmReset(
  request: FastifyRequest<{ Body: TwoFactorCodeRequest }>,
) {
  const { userId, id: sessionId } = request.session;
  const { challenges, sessions } = request.server;

  const pending = challenges.findReset(sessionId);
  if (!pending?.secret) throw new TwoFactorSetupExpiredError();
  const { secret } = pending;

  const recoveryCodes = await countingAttempts(
    request,
    pending,
    () =>
      service.saveEnrollment(
        depsOf(request),
        userId,
        secret,
        request.body.code,
        {
          replacing: true,
        },
      ),
    () =>
      new TwoFactorSetupExpiredError(
        'Too many incorrect codes. Start the reset again.',
      ),
  );

  challenges.discard(pending.key);
  // A new authenticator is a change of who can get in, so every other device
  // has to prove itself again; this one, which just did, stays.
  const revokedSessions = sessions.revokeOthers(userId, sessionId);
  request.log.info({ userId, revokedSessions }, 'Authenticator reset');
  return dataEnvelope({ recoveryCodes, revokedSessions });
}
