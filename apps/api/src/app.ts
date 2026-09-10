import { API_BASE_PATH } from '@coastal-talk-news/types';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Env } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { MAX_UPLOAD_BYTES } from './modules/media/image.js';
import {
  cmsCategoryRoutes,
  publicCategoryRoutes,
} from './modules/categories/routes.js';
import { dashboardRoutes } from './modules/dashboard/routes.js';
import { mediaRoutes } from './modules/media/routes.js';
import authPlugin from './plugins/auth.js';
import errorHandler from './plugins/error-handler.js';
import prismaPlugin from './plugins/prisma.js';
import storagePlugin from './plugins/storage.js';

export async function buildApp(env: Env): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: {
        paths: [
          'req.headers.cookie',
          'req.headers.authorization',
          'req.body.password',
          '*.passwordHash',
        ],
        censor: '[redacted]',
      },
    },
    // Render terminates TLS upstream; without this, Secure cookies break.
    trustProxy: true,
    // Without this a trailing slash falls through to the /:id route and fails
    // uuid validation instead of listing the collection.
    ignoreTrailingSlash: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(errorHandler);

  await app.register(cors, {
    // Exact origins only — credentialed CORS forbids a wildcard.
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Coastal Talk News API',
        description: [
          `All endpoints are served under \`${API_BASE_PATH}\`.`,
          '',
          `- \`${API_BASE_PATH}/public/*\` — reader site, unauthenticated, always filtered server-side.`,
          `- \`${API_BASE_PATH}/cms/*\` — admin panel, requires the session cookie.`,
          '',
          'Responses are enveloped: `{ success: true, data }` for a single resource,',
          '`{ success: true, data: [], meta }` for a list, and',
          '`{ success: false, error: { code, message, details? } }` for a failure.',
          'Dates are ISO 8601 strings and IDs are strings.',
        ].join('\n'),
        version: '1.0.0',
      },
      tags: [
        { name: 'system', description: 'Health and diagnostics' },
        { name: 'auth', description: 'CMS authentication' },
        { name: 'dashboard', description: 'Newsroom overview' },
        { name: 'categories', description: 'News categories' },
        { name: 'media', description: 'Media library' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(multipart, {
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 10 },
  });

  await app.register(prismaPlugin, { env });
  await app.register(storagePlugin, { env });
  await app.register(authPlugin, { env });

  // Unversioned and unenveloped on purpose: a platform liveness probe that the
  // ping-server workflow hits, not part of the client API.
  app.get(
    '/health',
    { schema: { tags: ['system'], summary: 'Liveness probe' } },
    async () => ({ status: 'ok' }),
  );

  await app.register(authRoutes, { prefix: `${API_BASE_PATH}/cms/auth` });
  await app.register(cmsCategoryRoutes, {
    prefix: `${API_BASE_PATH}/cms/categories`,
  });
  await app.register(dashboardRoutes, {
    prefix: `${API_BASE_PATH}/cms/dashboard`,
  });
  await app.register(mediaRoutes, {
    prefix: `${API_BASE_PATH}/cms/media`,
  });
  await app.register(publicCategoryRoutes, {
    prefix: `${API_BASE_PATH}/public/categories`,
  });

  return app;
}
