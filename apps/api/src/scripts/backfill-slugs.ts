import { createPrismaClient } from '@coastal-talk-news/db';
import { suggestArticleSlug } from '@coastal-talk-news/validation/slug';
import { loadEnv } from '../config/env.js';
import { generateUniqueSlug, uniqueArticleSlug } from '../lib/slugs.js';

/**
 * One-off, safe to repeat: gives every article and category that has no slug
 * yet one made the same way the API does for new ones. Rows that already have
 * a slug are never touched, so a slug an editor chose survives any number of
 * runs. Oldest first, so when two titles clash the earlier row keeps the plain
 * slug.
 *
 * An article whose headline and SEO title hold no letters at all can't be
 * named automatically; those are listed at the end, for an editor to set in
 * the CMS.
 */
const db = createPrismaClient(loadEnv().DATABASE_URL);

try {
  const articles = await db.article.findMany({
    where: { slug: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, headline: true, seoTitle: true, status: true },
  });
  const needsEditor: typeof articles = [];
  for (const article of articles) {
    const base = suggestArticleSlug(article);
    if (!base) {
      needsEditor.push(article);
      continue;
    }
    const slug = await uniqueArticleSlug(db, base, article.id);
    // Raw, so updated_at keeps meaning "last edited": it is the article's
    // dateModified for search engines, and adding a slug is not an edit.
    await db.$executeRaw`UPDATE articles SET slug = ${slug} WHERE id = ${article.id}`;
  }

  const categories = await db.category.findMany({
    where: { slug: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  for (const category of categories) {
    const slug = await generateUniqueSlug(db, category.name, category.id);
    await db.$executeRaw`UPDATE categories SET slug = ${slug} WHERE id = ${category.id}`;
  }

  console.log(
    `Gave slugs to ${articles.length - needsEditor.length} article(s) and ${categories.length} categor(y/ies).`,
  );
  if (needsEditor.length > 0) {
    console.log(
      `\n${needsEditor.length} article(s) need a slug typed in the CMS (until then they stay reachable by id):`,
    );
    for (const article of needsEditor) {
      console.log(
        `  ${article.status.padEnd(9)} ${article.id}  ${article.headline}`,
      );
    }
  }
} finally {
  await db.$disconnect();
}
