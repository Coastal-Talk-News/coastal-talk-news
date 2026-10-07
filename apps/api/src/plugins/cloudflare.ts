import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';
import {
  createCloudflareClient,
  type CloudflareClient,
} from '../lib/cloudflare.js';

declare module 'fastify' {
  interface FastifyInstance {
    cloudflare: CloudflareClient | null;
  }
}

async function cloudflarePlugin(
  app: FastifyInstance,
  options: { env: Env },
): Promise<void> {
  const { env } = options;
  app.decorate(
    'cloudflare',
    env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN
      ? createCloudflareClient(
          env.CLOUDFLARE_ACCOUNT_ID,
          env.CLOUDFLARE_API_TOKEN,
        )
      : null,
  );
}

export default fp(cloudflarePlugin, { name: 'cloudflare' });
