import type { FastifyRequest } from 'fastify';
import { dataEnvelope } from '../../lib/pagination.js';
import * as service from './service.js';

export async function getUsage(request: FastifyRequest) {
  return dataEnvelope(
    await service.getUsage({
      db: request.server.prisma,
      storage: request.server.storage,
    }),
  );
}

export async function getDashboard(request: FastifyRequest) {
  const data = await service.getDashboard({
    db: request.server.prisma,
    storage: request.server.storage,
  });
  return dataEnvelope(data);
}
