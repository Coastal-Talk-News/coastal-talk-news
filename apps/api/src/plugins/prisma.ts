import { createPrismaClient, type Database } from '@coastal-talk-news/db';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: Database;
  }
}

async function prismaPlugin(
  app: FastifyInstance,
  options: { env: Env },
): Promise<void> {
  const prisma = createPrismaClient(options.env.DATABASE_URL);

  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
