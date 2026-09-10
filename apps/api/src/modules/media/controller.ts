import type { FastifyReply, FastifyRequest } from 'fastify';
import { BadRequestError } from '../../lib/errors.js';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
import { MAX_UPLOAD_BYTES } from './image.js';
import { toMediaAssetDto } from './mapper.js';
import * as service from './service.js';

function deps(request: FastifyRequest): service.MediaServiceDeps {
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

export async function upload(request: FastifyRequest, reply: FastifyReply) {
  const files = request.files();
  const created = [];

  for await (const part of files) {
    const buffer = await part.toBuffer();
    // Fastify truncates at the configured limit rather than throwing, so an
    // oversized file would otherwise be stored silently corrupted.
    if (part.file.truncated) {
      throw new BadRequestError(
        `"${part.filename}" exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`,
      );
    }
    created.push(
      await service.upload(deps(request), { filename: part.filename, buffer }),
    );
  }

  if (created.length === 0) {
    throw new BadRequestError('No file was uploaded.');
  }

  const toUrl = publicUrl(request);
  return reply
    .status(201)
    .send(dataEnvelope(created.map((asset) => toMediaAssetDto(asset, toUrl))));
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
