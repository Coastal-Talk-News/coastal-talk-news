import type { Prisma, TransactionClient } from '@coastal-talk-news/db';
import type { AnalyticsSort, SortOrder } from '@coastal-talk-news/types';

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

export function countViewsSince(db: TransactionClient, since: Date) {
  return db.articleView.count({ where: { viewedAt: { gte: since } } });
}

export function countViewsBetween(db: TransactionClient, from: Date, to: Date) {
  return db.articleView.count({ where: { viewedAt: { gte: from, lt: to } } });
}

/** Null when there isn't a single recorded read yet. */
export async function earliestViewDate(
  db: TransactionClient,
): Promise<Date | null> {
  const row = await db.articleView.findFirst({
    orderBy: { viewedAt: 'asc' },
    select: { viewedAt: true },
  });
  return row?.viewedAt ?? null;
}

export function countArticles(db: TransactionClient) {
  return db.article.count();
}

/**
 * The chosen column first, then most read, so a category or a publication
 * date lists its articles by views. The last two keys make the order total,
 * so paging never repeats or skips an article.
 */
function orderFor(
  sort: AnalyticsSort,
  order: SortOrder,
): Prisma.ArticleOrderByWithRelationInput[] {
  const tail: Prisma.ArticleOrderByWithRelationInput[] = [
    { createdAt: 'desc' },
    { id: 'asc' },
  ];
  switch (sort) {
    case 'category':
      return [{ category: { name: order } }, { viewCount: 'desc' }, ...tail];
    case 'published':
      return [
        { publicationDate: { sort: order, nulls: 'last' } },
        { viewCount: 'desc' },
        ...tail,
      ];
    case 'views':
      return [{ viewCount: order }, ...tail];
  }
}

export function findArticles(
  db: TransactionClient,
  { sort, order }: { sort: AnalyticsSort; order: SortOrder },
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    orderBy: orderFor(sort, order),
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
