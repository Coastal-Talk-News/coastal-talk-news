import type { AnalyticsSort, SortOrder } from '@coastal-talk-news/types';
import type { FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import * as service from './service.js';

export async function getStats(request: FastifyRequest) {
  return dataEnvelope(await service.getStats(request.server.prisma));
}

export async function getStorage(request: FastifyRequest) {
  return dataEnvelope(await service.getStorage(request.server.prisma));
}

export async function getWeekViews(
  request: FastifyRequest<{ Querystring: { weeksAgo: number } }>,
) {
  return dataEnvelope(
    await service.getWeekViews(request.server.prisma, request.query.weeksAgo),
  );
}

export async function getMonthViews(
  request: FastifyRequest<{ Querystring: { year: number; month: number } }>,
) {
  return dataEnvelope(
    await service.getMonthViews(
      request.server.prisma,
      request.query.year,
      request.query.month,
    ),
  );
}

export async function getMonthlyViews(
  request: FastifyRequest<{ Querystring: { year: number } }>,
) {
  return dataEnvelope(
    await service.getMonthlyViews(request.server.prisma, request.query.year),
  );
}

export async function getYearRange(request: FastifyRequest) {
  return dataEnvelope(await service.getYearRange(request.server.prisma));
}

export async function listArticles(
  request: FastifyRequest<{
    Querystring: {
      page: number;
      limit: number;
      sort: AnalyticsSort;
      order: SortOrder;
    };
  }>,
) {
  const { page, limit, sort, order } = request.query;
  const pagination = { page, limit };
  const { rows, total } = await service.listArticles(
    request.server.prisma,
    { sort, order },
    pagination,
  );
  return listEnvelope(rows, pagination, total);
}
