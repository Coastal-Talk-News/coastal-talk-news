import type { RegisterMediaRequest } from '@coastal-talk-news/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import { toMediaAssetDto } from './mapper.js';
import * as service from './service.js';

function deps(request: FastifyRequest): service.MediaServiceDeps {
  return {
    db: request.server.prisma,
    storage: request.server.storage,
    logger: request.log,
    maxTotalBytes: request.server.mediaStorageCapBytes,
  };
}

function publicUrl(request: FastifyRequest) {
  const { storage } = request.server;
  return (storageKey: string) => storage.publicUrl(storageKey);
}

export async function list(
  request: FastifyRequest<{
    Querystring: { page: number; limit: number; search?: string };
  }>,
) {
  const { page, limit, search } = request.query;
  const pagination = { page, limit };
  const { rows, total, usage } = await service.list(
    deps(request),
    search ? { search } : {},
    pagination,
  );
  const toUrl = publicUrl(request);
  return listEnvelope(
    rows.map((row) => toMediaAssetDto(row, toUrl, usage.get(row.id))),
    pagination,
    total,
  );
}

export async function getById(
  request: FastifyRequest<{ Params: { id: string } }>,
) {
  const { asset, usage } = await service.getById(
    deps(request),
    request.params.id,
  );
  return dataEnvelope(toMediaAssetDto(asset, publicUrl(request), usage));
}

export async function getUploadSignature(
  request: FastifyRequest<{ Body: { contentType: string } }>,
) {
  const ticket = await service.createUploadSignature(
    deps(request),
    request.body,
  );
  return dataEnvelope(ticket);
}

export async function registerUpload(
  request: FastifyRequest<{ Body: RegisterMediaRequest }>,
  reply: FastifyReply,
) {
  const asset = await service.registerUpload(deps(request), request.body);
  return reply
    .status(201)
    .send(dataEnvelope(toMediaAssetDto(asset, publicUrl(request))));
}

export async function remove(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await service.remove(deps(request), request.params.id);
  return reply.status(204).send(null);
}

export async function cleanup(request: FastifyRequest) {
  const removed = await service.cleanupUnused(deps(request));
  return dataEnvelope({ removed });
}
