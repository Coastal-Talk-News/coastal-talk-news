import type { Language } from '@coastal-talk-news/db';
import type { FastifyRequest } from 'fastify';
import { dataEnvelope, listEnvelope } from '../../lib/pagination.js';
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

interface SearchQuery {
  q: string;
  language?: Language;
  page: number;
  limit: number;
}

export async function search(
  request: FastifyRequest<{ Querystring: SearchQuery }>,
) {
  const { q, language, page, limit } = request.query;
  const pagination = { page, limit };
  const { rows, total } = await service.search(
    deps(request),
    { search: q, language },
    pagination,
  );
  return listEnvelope(rows, pagination, total);
}
