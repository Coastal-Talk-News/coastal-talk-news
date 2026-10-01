import { createPrismaClient } from '@coastal-talk-news/db';
import { loadEnv } from '../config/env.js';

/**
 * One-off, safe to repeat: `article_views` (added to log *when* a read
 * happens, for the Analytics page's Today/Week/Month/Year figures) started
 * empty, so reads counted before it existed have no timestamp. There's no
 * way to recover the real moment each of those reads happened — this stands
 * each one in for its article's publication date instead, the closest
 * signal available, and skips any article whose dated rows already match its
 * running total so re-running this adds nothing twice.
 */
const db = createPrismaClient(loadEnv().DATABASE_URL);

try {
  const articles = await db.article.findMany({
    where: { viewCount: { gt: 0 }, publicationDate: { not: null } },
    select: { id: true, viewCount: true, publicationDate: true },
  });

  let created = 0;
  for (const article of articles) {
    const logged = await db.articleView.count({
      where: { articleId: article.id },
    });
    const missing = article.viewCount - logged;
    if (missing <= 0) continue;

    await db.articleView.createMany({
      data: Array.from({ length: missing }, () => ({
        articleId: article.id,
        viewedAt: article.publicationDate!,
      })),
    });
    created += missing;
  }

  console.log(
    `Backfilled ${created} view(s) across ${articles.length} article(s) checked, dated to each article's publication date (an estimate, not the real read time).`,
  );
} finally {
  await db.$disconnect();
}
