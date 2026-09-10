import type { FastifyReply, FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import { toAdvertisementDto } from './mapper.js';
import type {
  AdvertisementServiceDeps,
  CreateAdvertisementInput,
  UpdateAdvertisementInput,
} from './service.js';
import * as service from './service.js';

function deps(request: FastifyRequest): AdvertisementServiceDeps {
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

interface ListQuery {
  page: number;
  limit: number;
}

export async function listForCms(
  request: FastifyRequest<{ Querystring: ListQuery }>,
) {
  const pagination = { page: request.query.page, limit: request.query.limit };
  const { rows, total } = await service.listForCms(deps(request), pagination);
  const toUrl = publicUrl(request);
  return listEnvelope(
    rows.map((row) => toAdvertisementDto(row, toUrl)),
    pagination,
    total,
  );
}

export async function getForCms(request: FastifyRequest<{ Params: IdParams }>) {
  const item = await service.getForCms(deps(request), request.params.id);
  return dataEnvelope(toAdvertisementDto(item, publicUrl(request)));
}

export async function create(
  request: FastifyRequest<{ Body: CreateAdvertisementInput }>,
  reply: FastifyReply,
) {
  const item = await service.create(deps(request), request.body);
  return reply
    .status(201)
    .send(dataEnvelope(toAdvertisementDto(item, publicUrl(request))));
}

export async function update(
  request: FastifyRequest<{ Params: IdParams; Body: UpdateAdvertisementInput }>,
) {
  const item = await service.update(
    deps(request),
    request.params.id,
    request.body,
  );
  return dataEnvelope(toAdvertisementDto(item, publicUrl(request)));
}

export async function remove(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
) {
  await service.remove(deps(request), request.params.id);
  return reply.status(204).send(null);
}
