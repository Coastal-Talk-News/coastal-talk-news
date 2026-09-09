import type { TransactionClient } from '@coastal-talk-news/db';

export type BreakingNewsRow = Awaited<ReturnType<typeof findById>>;

export function findById(db: TransactionClient, id: string) {
  return db.breakingNews.findUnique({ where: { id } });
}

export function findMany(
  db: TransactionClient,
  page: { skip: number; take: number },
) {
  return db.breakingNews.findMany({
    // Newest-created schedule first; the CMS re-sorts client-side by start
    // time when the viewer picks "Oldest First".
    orderBy: { startAt: 'desc' },
    ...page,
  });
}

export function count(db: TransactionClient) {
  return db.breakingNews.count();
}

export function create(
  db: TransactionClient,
  data: {
    headline: string;
    articleUrl: string;
    startAt: Date;
    endAt: Date | null;
  },
) {
  return db.breakingNews.create({ data });
}

export function update(
  db: TransactionClient,
  id: string,
  data: {
    headline?: string;
    articleUrl?: string;
    startAt?: Date;
    endAt?: Date | null;
  },
) {
  return db.breakingNews.update({ where: { id }, data });
}

export function remove(db: TransactionClient, id: string) {
  return db.breakingNews.delete({ where: { id }, select: { id: true } });
}
