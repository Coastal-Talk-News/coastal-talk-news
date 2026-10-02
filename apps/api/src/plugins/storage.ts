import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';
import {
  createObjectStorage,
  type ObjectStorage,
} from '../modules/media/storage.js';

declare module 'fastify' {
  interface FastifyInstance {
    storage: ObjectStorage;
    mediaStorageCapBytes: number;
  }
}

async function storagePlugin(
  app: FastifyInstance,
  options: { env: Env },
): Promise<void> {
  app.decorate('storage', createObjectStorage(options.env));
  app.decorate(
    'mediaStorageCapBytes',
    options.env.MEDIA_STORAGE_CAP_MB * 1_000_000,
  );
}

export default fp(storagePlugin, { name: 'storage' });
