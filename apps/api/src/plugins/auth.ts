import cookie from '@fastify/cookie';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';
import {
  SessionStore,
  type SessionRecord,
} from '../modules/auth/session-store.js';

export const SESSION_COOKIE = 'ctn_session';

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
  }

  interface FastifyRequest {
    session: SessionRecord;
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

  await app.register(cookie, { secret: env.SESSION_SECRET });
  app.decorate('sessions', sessions);

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
      const token = readToken(request);
      if (token) {
        sessions.revokeByToken(token);
      }
      reply.clearCookie(SESSION_COOKIE, cookieOptions);
    },
  );

  function readToken(request: FastifyRequest): string | null {
    const raw = request.cookies[SESSION_COOKIE];
    if (!raw) {
      return null;
    }
    const unsigned = request.unsignCookie(raw);
    return unsigned.valid ? unsigned.value : null;
  }

  app.decorate('requireAuth', async (request: FastifyRequest) => {
    const token = readToken(request);
    const session = token ? sessions.verify(token) : null;

    if (!session) {
      throw new UnauthorizedError();
    }
    request.session = session;
  });

  const sweeper = setInterval(() => sessions.sweep(), SWEEP_INTERVAL_MS);
  sweeper.unref();
  app.addHook('onClose', async () => clearInterval(sweeper));
}

export default fp(authPlugin, { name: 'auth' });
