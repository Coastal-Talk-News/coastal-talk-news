import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env itself. apps/api/.env is the only place
// DATABASE_URL is defined, so migrations and the API cannot target different
// databases. No-ops in deployment, where Render injects the variable.
const apiEnvFile = path.join(
  import.meta.dirname,
  '..',
  '..',
  'apps',
  'api',
  '.env',
);
if (existsSync(apiEnvFile)) {
  process.loadEnvFile(apiEnvFile);
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    // Via pnpm exec because Prisma spawns this without node_modules/.bin on PATH.
    seed: 'pnpm exec tsx prisma/seed.ts',
  },
  // Not Prisma's env() helper: it throws during config load, breaking
  // `prisma generate` on a machine with no database configured.
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
