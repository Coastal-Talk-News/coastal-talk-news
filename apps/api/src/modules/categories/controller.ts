import type { FastifyReply, FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import type { ToPublicUrl } from './mapper.js';
import { toCategoryDto, toCmsCategoryDto } from './mapper.js';
import type {
  CategoryServiceDeps,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './service.js';
import * as service from './service.js';

function deps(request: FastifyRequest): CategoryServiceDeps {
  return {
    db: request.server.prisma,
    storage: request.server.storage,
    logger: request.log,
  };
}

function publicUrl(request: FastifyRequest): ToPublicUrl {
  const { storage } = request.server;
  return (storageKey) => storage.publicUrl(storageKey);
}

interface IdParams {
  id: string;
}

interface ListQuery {
  page: number;
  limit: number;
}

export async function listForCms(
  request: FastifyRequest<{ Querystring: ListQuery & { isActive?: boolean } }>,
) {
  const { page, limit, isActive } = request.query;
  const pagination = { page, limit };
  const { rows, total } = await service.listForCms(
    deps(request),
    isActive === undefined ? {} : { isActive },
    pagination,
  );
  const toUrl = publicUrl(request);
  return listEnvelope(
    rows.map((row) => toCmsCategoryDto(row, toUrl)),
    pagination,
    total,
  );
}

export async function getForCms(request: FastifyRequest<{ Params: IdParams }>) {
  const category = await service.getForCms(deps(request), request.params.id);
  return dataEnvelope(toCmsCategoryDto(category, publicUrl(request)));
}

export async function create(
  request: FastifyRequest<{ Body: CreateCategoryInput }>,
  reply: FastifyReply,
) {
  const category = await service.create(deps(request), request.body);
  return reply
    .status(201)
    .send(dataEnvelope(toCmsCategoryDto(category, publicUrl(request))));
}

export async function update(
  request: FastifyRequest<{ Params: IdParams; Body: UpdateCategoryInput }>,
) {
  const category = await service.update(
    deps(request),
    request.params.id,
    request.body,
  );
  return dataEnvelope(toCmsCategoryDto(category, publicUrl(request)));
}

export async function reorder(
  request: FastifyRequest<{ Body: { ids: string[] } }>,
  reply: FastifyReply,
) {
  await service.reorder(deps(request), request.body.ids);
  return reply.status(204).send(null);
}

export async function remove(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
) {
  await service.remove(deps(request), request.params.id);
  return reply.status(204).send(null);
}

export async function listPublic(
  request: FastifyRequest<{ Querystring: ListQuery }>,
) {
  const pagination = { page: request.query.page, limit: request.query.limit };
  const { rows, total } = await service.listPublic(deps(request), pagination);
  const toUrl = publicUrl(request);
  return listEnvelope(
    rows.map((row) => toCategoryDto(row, toUrl)),
    pagination,
    total,
  );
}

export async function getPublic(request: FastifyRequest<{ Params: IdParams }>) {
  const category = await service.getPublic(deps(request), request.params.id);
  return dataEnvelope(toCategoryDto(category, publicUrl(request)));
}
