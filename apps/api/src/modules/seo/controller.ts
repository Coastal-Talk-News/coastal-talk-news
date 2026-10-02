import type { FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import * as service from './service.js';

export async function getHealth(request: FastifyRequest) {
  return dataEnvelope(await service.getHealth(request.server.prisma));
}

export async function listArticleIssues(
  request: FastifyRequest<{ Querystring: { page: number; limit: number } }>,
) {
  const { page, limit } = request.query;
  const pagination = { page, limit };
  const { rows, total } = await service.listArticleIssues(
    request.server.prisma,
    pagination,
  );
  return listEnvelope(rows, pagination, total);
}
