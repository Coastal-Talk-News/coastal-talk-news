import type { PublicArticleDto } from '@coastal-talk-news/types';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { PreviewStore } from '../modules/articles/preview-store.js';

declare module 'fastify' {
  interface FastifyInstance {
    previews: PreviewStore<PublicArticleDto>;
  }
}

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

async function previewsPlugin(app: FastifyInstance): Promise<void> {
  const previews = new PreviewStore<PublicArticleDto>();
  app.decorate('previews', previews);

  const sweeper = setInterval(() => previews.sweep(), SWEEP_INTERVAL_MS);
  sweeper.unref();
  app.addHook('onClose', async () => clearInterval(sweeper));
}

export default fp(previewsPlugin, { name: 'previews' });
