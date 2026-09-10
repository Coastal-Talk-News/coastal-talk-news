import type { FastifyRequest } from 'fastify';
import { dataEnvelope } from '../../lib/pagination.js';
import { toSiteSettingsDto } from './mapper.js';
import type {
  SettingsServiceDeps,
  UpdateSiteSettingsInput,
} from './service.js';
import * as service from './service.js';

function deps(request: FastifyRequest): SettingsServiceDeps {
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

export async function getForCms(request: FastifyRequest) {
  const settings = await service.getForCms(deps(request));
  return dataEnvelope(toSiteSettingsDto(settings, publicUrl(request)));
}

export async function update(
  request: FastifyRequest<{ Body: UpdateSiteSettingsInput }>,
) {
  const settings = await service.update(deps(request), request.body);
  return dataEnvelope(toSiteSettingsDto(settings, publicUrl(request)));
}
