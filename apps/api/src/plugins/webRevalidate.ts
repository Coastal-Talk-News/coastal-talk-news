import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';
import {
  webRevalidateConfig,
  type WebRevalidateConfig,
} from '../lib/webRevalidate.js';

declare module 'fastify' {
  interface FastifyInstance {
    webRevalidate: WebRevalidateConfig;
  }
}

async function webRevalidatePlugin(
  app: FastifyInstance,
  options: { env: Env },
): Promise<void> {
  app.decorate('webRevalidate', webRevalidateConfig(options.env));
}

export default fp(webRevalidatePlugin, { name: 'webRevalidate' });
