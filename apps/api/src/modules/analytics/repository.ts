import type { TransactionClient } from '@coastal-talk-news/db';

export interface TableSizeRow {
  table: string;
  bytes: bigint;
  /** From Postgres's own autovacuum stats, not a live COUNT(*) — exact would
   *  mean scanning every table just to render a usage page. */
  rowEstimate: bigint;
}

/**
 * This app's own tables, largest first. Scoped to the `public` schema (where
 * every Prisma model lives, see schema.prisma) on purpose: Supabase
 * provisions its own `auth`/`storage`/`realtime`/... schemas alongside it for
 * platform features this app doesn't use, and without the filter those show
 * up as unrelated, mostly-empty "tables" in what should be this app's own
 * breakdown.
 */
export function tableSizes(db: TransactionClient): Promise<TableSizeRow[]> {
  return db.$queryRaw<TableSizeRow[]>`
    SELECT
      relname AS table,
      pg_total_relation_size(relid) AS bytes,
      GREATEST(n_live_tup, 0) AS "rowEstimate"
    FROM pg_catalog.pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY bytes DESC
  `;
}

export async function sumViews(db: TransactionClient) {
  const total = await db.article.aggregate({ _sum: { viewCount: true } });
  return total._sum.viewCount ?? 0;
}

export function countArticles(db: TransactionClient) {
  return db.article.count();
}

export function findArticlesByViews(
  db: TransactionClient,
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    // The id breaks ties so paging never repeats or skips an article.
    orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    ...page,
    select: {
      id: true,
      headline: true,
      status: true,
      content: true,
      publicationDate: true,
      viewCount: true,
      category: { select: { name: true } },
    },
  });
}
