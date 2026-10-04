import { createPrismaClient } from '../src/index.js';

/**
 * One-off repair for a migration-history gap: five migrations existed on the
 * shared database (built by another developer, never committed to git) with
 * no matching files anywhere in this repo. Those files have now been
 * reconstructed from the live database's actual schema and committed, so
 * `prisma migrate dev`/`deploy` can run again - but their content is an
 * approximation of the originals, not a byte-for-byte match, so Prisma's own
 * "was this migration edited after it ran" checksum check correctly flags
 * them. This updates only Prisma's own bookkeeping (the checksum column of
 * its internal `_prisma_migrations` table) to match the files that now
 * represent reality - it touches no real table, no real data, and no
 * finished_at value.
 *
 *   pnpm --filter @coastal-talk-news/db db:fix-migration-checksums
 *
 * Safe to run more than once; it is a no-op once the checksums already match.
 */
const RECONCILED: { name: string; sha256: string }[] = [
  {
    name: '20260913163812_add_footer_ad_placement',
    sha256: 'a2f90aa7ced330599d17d8b797ddd164bab7da9840d3f956a4c67c434dfe6640',
  },
  {
    name: '20260913170000_restore_article_search_indexes_again',
    sha256: '775f16fb246cc3a55c377212bec100eeff007fd8769243e0e2f1509350cfb806',
  },
  {
    name: '20260927150000_media_usage_in_content',
    sha256: '1f4d82c1763dbe820733eef3e69bd4188557ef8abac5a81bb269a1ae910dcd6f',
  },
  {
    name: '20261003180000_advertisement_layers',
    sha256: 'db70ee97d2aedc68eb0f29691136b7943e1d68b200e98c9252cc01535b880406',
  },
  {
    name: '20261003190000_advertisement_layers_as_cells',
    sha256: 'b16c3b7d953dd7af0e4489042c7453216ca75f05b1720c1e2c8160ec5a097ba9',
  },
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL must be set (apps/api/.env provides it).');
  }

  const prisma = createPrismaClient(url);
  try {
    for (const { name, sha256 } of RECONCILED) {
      // Only the row that actually finished - a stray incomplete attempt for
      // the first migration is left untouched on purpose.
      const result = await prisma.$executeRawUnsafe(
        `UPDATE _prisma_migrations SET checksum = $1 WHERE migration_name = $2 AND finished_at IS NOT NULL`,
        sha256,
        name,
      );
      console.log(`${name}: ${result} row(s) updated.`);
    }
    console.log('Done. Re-run `pnpm db:migrate` now.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
