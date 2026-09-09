import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';
import { ObjectStorage } from '../modules/media/storage.js';

declare module 'fastify' {
  interface FastifyInstance {
    storage: ObjectStorage;
  }
}

async function storagePlugin(
  app: FastifyInstance,
  options: { env: Env },
): Promise<void> {
  app.decorate('storage', new ObjectStorage(options.env));
}

export default fp(storagePlugin, { name: 'storage' });
