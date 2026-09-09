import type { FastifyReply, FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import { toBreakingNewsDto } from './mapper.js';
import type {
  BreakingNewsServiceDeps,
  CreateBreakingNewsInput,
  UpdateBreakingNewsInput,
} from './service.js';
import * as service from './service.js';

function deps(request: FastifyRequest): BreakingNewsServiceDeps {
  return { db: request.server.prisma, logger: request.log };
}

interface IdParams {
  id: string;
}

interface ListQuery {
  page: number;
  limit: number;
}

export async function listForCms(
  request: FastifyRequest<{ Querystring: ListQuery }>,
) {
  const pagination = { page: request.query.page, limit: request.query.limit };
  const { rows, total } = await service.listForCms(deps(request), pagination);
  return listEnvelope(
    rows.map((row) => toBreakingNewsDto(row)),
    pagination,
    total,
  );
}

export async function getForCms(request: FastifyRequest<{ Params: IdParams }>) {
  const item = await service.getForCms(deps(request), request.params.id);
  return dataEnvelope(toBreakingNewsDto(item));
}

export async function create(
  request: FastifyRequest<{ Body: CreateBreakingNewsInput }>,
  reply: FastifyReply,
) {
  const item = await service.create(deps(request), request.body);
  return reply.status(201).send(dataEnvelope(toBreakingNewsDto(item)));
}

export async function update(
  request: FastifyRequest<{ Params: IdParams; Body: UpdateBreakingNewsInput }>,
) {
  const item = await service.update(
    deps(request),
    request.params.id,
    request.body,
  );
  return dataEnvelope(toBreakingNewsDto(item));
}

export async function remove(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
) {
  await service.remove(deps(request), request.params.id);
  return reply.status(204).send(null);
}
