import cookie from '@fastify/cookie';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';
import { SignInExpiredError, UnauthorizedError } from '../lib/errors.js';
import { SecretBox } from '../lib/secret-box.js';
import {
  CHALLENGE_TTL_MS,
  ChallengeStore,
  type Challenge,
  type ChallengeKind,
} from '../modules/auth/challenge-store.js';
import {
  SessionStore,
  type SessionRecord,
} from '../modules/auth/session-store.js';

export const SESSION_COOKIE = 'ctn_session';
/** Proof that a password was accepted and a second factor is now owed. It is
 *  not a session and opens nothing except the second step itself. */
export const CHALLENGE_COOKIE = 'ctn_2fa';

declare module 'fastify' {
  interface FastifyInstance {
    sessions: SessionStore;
    requireAuth: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    issueSession: (
      request: FastifyRequest,
      reply: FastifyReply,
      userId: string,
    ) => SessionRecord;
    clearSession: (request: FastifyRequest, reply: FastifyReply) => void;
    challenges: ChallengeStore;
    secretBox: SecretBox;
    issueChallenge: (
      request: FastifyRequest,
      reply: FastifyReply,
      userId: string,
      kind: ChallengeKind,
    ) => Challenge;
    clearChallenge: (request: FastifyRequest, reply: FastifyReply) => void;
    requireChallenge: (
      kind: ChallengeKind,
    ) => (request: FastifyRequest) => Promise<void>;
  }

  interface FastifyRequest {
    session: SessionRecord;
    challenge: Challenge;
  }
}

const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

async function authPlugin(
  app: FastifyInstance,
  options: { env: Env },
): Promise<void> {
  const { env } = options;
  const isProduction = env.NODE_ENV === 'production';
  const absoluteTtlMs = env.SESSION_TTL_HOURS * 60 * 60 * 1000;

  const sessions = new SessionStore({
    absoluteTtlMs,
    idleTtlMs: env.SESSION_IDLE_MINUTES * 60 * 1000,
    maxPerUser: env.SESSION_MAX_PER_USER,
  });

  const challenges = new ChallengeStore();

  await app.register(cookie, { secret: env.SESSION_SECRET });
  app.decorate('sessions', sessions);
  app.decorate('challenges', challenges);
  app.decorate('secretBox', new SecretBox(env.totpKey));

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    signed: true,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    secure: isProduction,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };

  app.decorate(
    'issueSession',
    (request: FastifyRequest, reply: FastifyReply, userId: string) => {
      const { token, session } = sessions.create(userId, {
        userAgent: request.headers['user-agent'] ?? null,
        ipAddress: request.ip,
      });
      reply.setCookie(SESSION_COOKIE, token, {
        ...cookieOptions,
        maxAge: Math.floor(absoluteTtlMs / 1000),
      });
      return session;
    },
  );

  app.decorate(
    'clearSession',
    (request: FastifyRequest, reply: FastifyReply) => {
      const token = readToken(request, SESSION_COOKIE);
      if (token) {
        sessions.revokeByToken(token);
      }
      reply.clearCookie(SESSION_COOKIE, cookieOptions);
    },
  );

  function readToken(request: FastifyRequest, name: string): string | null {
    const raw = request.cookies[name];
    if (!raw) {
      return null;
    }
    const unsigned = request.unsignCookie(raw);
    return unsigned.valid ? unsigned.value : null;
  }

  app.decorate(
    'issueChallenge',
    (
      request: FastifyRequest,
      reply: FastifyReply,
      userId: string,
      kind: ChallengeKind,
    ) => {
      // A fresh password check replaces whatever was pending before it.
      const previous = readToken(request, CHALLENGE_COOKIE);
      if (previous) challenges.discardToken(previous);

      const { token, challenge } = challenges.issue(userId, kind);
      reply.setCookie(CHALLENGE_COOKIE, token, {
        ...cookieOptions,
        maxAge: Math.floor(CHALLENGE_TTL_MS / 1000),
      });
      return challenge;
    },
  );

  app.decorate(
    'clearChallenge',
    (request: FastifyRequest, reply: FastifyReply) => {
      const token = readToken(request, CHALLENGE_COOKIE);
      if (token) challenges.discardToken(token);
      reply.clearCookie(CHALLENGE_COOKIE, cookieOptions);
    },
  );

  app.decorate('requireChallenge', (kind: ChallengeKind) => {
    return async (request: FastifyRequest) => {
      const token = readToken(request, CHALLENGE_COOKIE);
      const challenge = token ? challenges.find(token) : null;

      // Asking for the wrong step (a code when setup is owed, or the reverse)
      // is treated as no sign-in at all rather than explained.
      if (!challenge || challenge.kind !== kind) {
        throw new SignInExpiredError();
      }
      request.challenge = challenge;
    };
  });

  app.decorate('requireAuth', async (request: FastifyRequest) => {
    const token = readToken(request, SESSION_COOKIE);
    const session = token ? sessions.verify(token) : null;

    if (!session) {
      throw new UnauthorizedError();
    }
    request.session = session;
  });

  const sweeper = setInterval(() => {
    sessions.sweep();
    challenges.sweep();
  }, SWEEP_INTERVAL_MS);
  sweeper.unref();
  app.addHook('onClose', async () => clearInterval(sweeper));
}

export default fp(authPlugin, { name: 'auth' });
