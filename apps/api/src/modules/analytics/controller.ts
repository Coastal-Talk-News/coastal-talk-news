import type { FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import * as service from './service.js';

export async function getStats(request: FastifyRequest) {
  return dataEnvelope(await service.getStats(request.server.prisma));
}

export async function listArticles(
  request: FastifyRequest<{ Querystring: { page: number; limit: number } }>,
) {
  const { page, limit } = request.query;
  const pagination = { page, limit };
  const { rows, total } = await service.listArticles(
    request.server.prisma,
    pagination,
  );
  return listEnvelope(rows, pagination, total);
}
