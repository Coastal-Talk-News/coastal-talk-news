import type { LoginRequest, SessionDto } from '@coastal-talk-news/types';
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
