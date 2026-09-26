import type { TransactionClient } from '@coastal-talk-news/db';

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
