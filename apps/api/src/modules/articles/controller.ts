import type { FastifyReply, FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import { toArticleDto } from './mapper.js';
import type { ListFilters } from './repository.js';
import type {
  ArticleServiceDeps,
  CreateArticleInput,
  UpdateArticleInput,
} from './service.js';
import * as service from './service.js';

function deps(request: FastifyRequest): ArticleServiceDeps {
  return {
    db: request.server.prisma,
    storage: request.server.storage,
    logger: request.log,
  };
}

function publicUrl(request: FastifyRequest) {
  const { storage } = request.server;
  return (storageKey: string) => storage.publicUrl(storageKey);
}

interface IdParams {
  id: string;
}

interface ListQuery extends ListFilters {
  page: number;
  limit: number;
}

export async function listForCms(
  request: FastifyRequest<{ Querystring: ListQuery }>,
) {
  const { page, limit, ...filters } = request.query;
  const pagination = { page, limit };
  const { rows, total } = await service.listForCms(
    deps(request),
    filters,
    pagination,
  );
  const toUrl = publicUrl(request);
  return listEnvelope(
    rows.map((row) => toArticleDto(row, toUrl)),
    pagination,
    total,
  );
}

export async function counts(
  request: FastifyRequest<{ Querystring: Omit<ListFilters, 'status'> }>,
) {
  const result = await service.getStatusCounts(deps(request), request.query);
  return dataEnvelope(result);
}

export async function getForCms(request: FastifyRequest<{ Params: IdParams }>) {
  const article = await service.getForCms(deps(request), request.params.id);
  return dataEnvelope(toArticleDto(article, publicUrl(request)));
}

export async function create(
  request: FastifyRequest<{ Body: CreateArticleInput }>,
  reply: FastifyReply,
) {
  const article = await service.create(deps(request), request.body);
  return reply
    .status(201)
    .send(dataEnvelope(toArticleDto(article, publicUrl(request))));
}

export async function update(
  request: FastifyRequest<{ Params: IdParams; Body: UpdateArticleInput }>,
) {
  const article = await service.update(
    deps(request),
    request.params.id,
    request.body,
  );
  return dataEnvelope(toArticleDto(article, publicUrl(request)));
}

export async function remove(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
) {
  await service.remove(deps(request), request.params.id);
  return reply.status(204).send(null);
}
