import type { Prisma, TransactionClient } from '@coastal-talk-news/db';

const published = { status: 'PUBLISHED' } as const;
const activeCategory = { isActive: true } as const;

// "Missing" means unset or blank: the CMS saves a cleared field as null, but
// rows written by older code may hold an empty string.
const articleIssues = [
  { seoTitle: null },
  { seoTitle: '' },
  { metaDescription: null },
  { metaDescription: '' },
  { slug: null },
  { mediaId: null },
] satisfies Prisma.ArticleWhereInput[];

const categoryIssues = [
  { seoTitle: null },
  { seoTitle: '' },
  { metaDescription: null },
  { metaDescription: '' },
  { slug: null },
] satisfies Prisma.CategoryWhereInput[];

/** Every article count in one pass, so the page costs one query, not five. */
export async function countArticleIssues(db: TransactionClient) {
  const [row] = await db.$queryRaw<
    Array<{
      published: number;
      missingSeoTitle: number;
      missingMetaDescription: number;
      missingSlug: number;
      missingFeaturedImage: number;
    }>
  >`
    SELECT
      count(*)::int AS "published",
      count(*) FILTER (WHERE coalesce(trim(seo_title), '') = '')::int AS "missingSeoTitle",
      count(*) FILTER (WHERE coalesce(trim(meta_description), '') = '')::int AS "missingMetaDescription",
      count(*) FILTER (WHERE slug IS NULL)::int AS "missingSlug",
      count(*) FILTER (WHERE media_id IS NULL)::int AS "missingFeaturedImage"
    FROM articles
    WHERE status = 'PUBLISHED'::"ArticleStatus"
  `;
  return row;
}

export async function countCategoryIssues(db: TransactionClient) {
  const [row] = await db.$queryRaw<
    Array<{
      active: number;
      missingSeoTitle: number;
      missingMetaDescription: number;
      missingSlug: number;
    }>
  >`
    SELECT
      count(*)::int AS "active",
      count(*) FILTER (WHERE coalesce(trim(seo_title), '') = '')::int AS "missingSeoTitle",
      count(*) FILTER (WHERE coalesce(trim(meta_description), '') = '')::int AS "missingMetaDescription",
      count(*) FILTER (WHERE slug IS NULL)::int AS "missingSlug"
    FROM categories
    WHERE is_active
  `;
  return row;
}

const withIssues = { ...published, OR: articleIssues };

export function countArticlesWithIssues(db: TransactionClient) {
  return db.article.count({ where: withIssues });
}

export function findArticlesWithIssues(
  db: TransactionClient,
  page: { skip: number; take: number },
) {
  return db.article.findMany({
    where: withIssues,
    orderBy: [{ publicationDate: 'desc' }, { id: 'asc' }],
    ...page,
    select: {
      id: true,
      headline: true,
      publicationDate: true,
      seoTitle: true,
      metaDescription: true,
      slug: true,
      mediaId: true,
    },
  });
}

export function findCategoriesWithIssues(db: TransactionClient) {
  return db.category.findMany({
    where: { ...activeCategory, OR: categoryIssues },
    orderBy: [
      { parentId: { sort: 'asc', nulls: 'first' } },
      { displayOrder: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      seoTitle: true,
      metaDescription: true,
      slug: true,
      parent: { select: { name: true } },
    },
  });
}

export function findSiteSettings(db: TransactionClient) {
  return db.siteSettings.findFirst({
    select: {
      siteName: true,
      defaultSeoTitle: true,
      defaultMetaDescription: true,
      logoMediaId: true,
      faviconMediaId: true,
      defaultOgImageId: true,
      googleSiteVerification: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      xUrl: true,
    },
  });
}
