import type { FastifyRequest } from 'fastify';
import { dataEnvelope } from '../../lib/pagination.js';
import type { PublicServiceDeps } from './service.js';
import * as service from './service.js';

function deps(request: FastifyRequest): PublicServiceDeps {
  const { prisma, storage } = request.server;
  return {
    db: prisma,
    toPublicUrl: (storageKey) => storage.publicUrl(storageKey),
  };
}

export async function getSite(request: FastifyRequest) {
  return dataEnvelope(await service.getSite(deps(request)));
}

export async function getHome(request: FastifyRequest) {
  return dataEnvelope(await service.getHome(deps(request)));
}

export async function getArticle(
  request: FastifyRequest<{ Params: { id: string } }>,
) {
  return dataEnvelope(
    await service.getArticle(deps(request), request.params.id),
  );
}
