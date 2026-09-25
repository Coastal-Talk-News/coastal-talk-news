import type {
  ChangePasswordRequest,
  LoginRequest,
  SessionDto,
} from '@coastal-talk-news/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError } from '../../lib/errors.js';
import { dataEnvelope } from '../../lib/pagination.js';
import type { SessionRecord } from './session-store.js';
import * as service from './service.js';

function toSessionDto(session: SessionRecord, currentId: string): SessionDto {
  return {
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    isCurrent: session.id === currentId,
  };
}

export async function login(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body;
  const user = await service.authenticate(
    request.server.prisma,
    email,
    password,
  );

  request.server.issueSession(request, reply, user.id);
  return dataEnvelope(user);
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  request.server.clearSession(request, reply);
  return reply.status(204).send(null);
}

export async function me(request: FastifyRequest) {
  const user = await service.getCurrentUser(
    request.server.prisma,
    request.session.userId,
  );
  return dataEnvelope(user);
}

export async function listSessions(request: FastifyRequest) {
  const sessions = request.server.sessions.listForUser(request.session.userId);
  return dataEnvelope(
    sessions.map((session) => toSessionDto(session, request.session.id)),
  );
}

export async function revokeSession(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { sessions } = request.server;
  const { id } = request.params;

  if (id === request.session.id) {
    request.server.clearSession(request, reply);
    return reply.status(204).send(null);
  }

  if (!sessions.revokeForUser(request.session.userId, id)) {
    throw new NotFoundError('Session');
  }
  return reply.status(204).send(null);
}

export async function revokeOtherSessions(request: FastifyRequest) {
  const revoked = request.server.sessions.revokeOthers(
    request.session.userId,
    request.session.id,
  );
  return dataEnvelope({ revoked });
}

export async function changePassword(
  request: FastifyRequest<{ Body: ChangePasswordRequest }>,
  reply: FastifyReply,
) {
  const { userId, id: sessionId } = request.session;
  const { currentPassword, newPassword } = request.body;
  const { sessions } = request.server;

  await service.changePassword(
    request.server.prisma,
    userId,
    currentPassword,
    newPassword,
  );

  // Anyone holding a token from before the change loses it: every other device
  // signs in again, and this one is handed a fresh token so a copy of the old
  // one is worthless too.
  const revokedSessions = sessions.revokeOthers(userId, sessionId);
  sessions.revokeForUser(userId, sessionId);
  request.server.issueSession(request, reply, userId);

  return dataEnvelope({ revokedSessions });
}
