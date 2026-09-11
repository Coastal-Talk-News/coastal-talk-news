import {
  Prisma,
  type ArticlePriority,
  type ArticleStatus,
  type Language,
  type TransactionClient,
} from '@coastal-talk-news/db';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

const withRelations = {
  category: { select: { id: true, name: true } },
  media: mediaSelect,
  ogImage: mediaSelect,
} as const;

export type ArticleRow = Awaited<ReturnType<typeof findById>>;

export interface ListFilters {
  categoryId?: string;
  language?: Language;
  status?: ArticleStatus;
  priority?: ArticlePriority;
  /** Full-text over headline and body, with a trigram fallback for typos. */
  search?: string;
  sort?: 'newest' | 'oldest';
}

export interface StatusCount {
  status: ArticleStatus;
  count: number;
}

function whereFromFilters(filters: Omit<ListFilters, 'search' | 'sort'>) {
  const { categoryId, language, status, priority } = filters;
  return {
    ...(categoryId ? { categoryId } : {}),
    ...(language ? { language } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };
}

// `:*` makes every token a prefix, so partial words match while typing.
// plainto_tsquery would only match whole words, leaving "Udup" with no hits.
function toPrefixQuery(term: string): string {
  // \p{M} keeps combining marks attached: without it Kannada "ಮಂಗ" splits into
  // two tokens and matches nothing.
  const tokens = term.toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu) ?? [];
  return tokens.map((token) => `${token}:*`).join(' & ');
}

function searchCondition(term: string, tsquery: string): Prisma.Sql {
  const prefixMatch = Prisma.sql`search_vector @@ to_tsquery('simple', ${tsquery})`;
  // Trigrams need three characters before similarity means anything.
  return term.trim().length < 3
    ? Prisma.sql`(${prefixMatch})`
    : Prisma.sql`(${prefixMatch} OR ${term} <% headline)`;
}

function sqlWhere(filters: ListFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (filters.categoryId) {
    conditions.push(Prisma.sql`category_id = ${filters.categoryId}`);
  }
  if (filters.language) {
    conditions.push(Prisma.sql`language = ${filters.language}::"Language"`);
  }
  if (filters.status) {
    conditions.push(Prisma.sql`status = ${filters.status}::"ArticleStatus"`);
  }
  if (filters.priority) {
    conditions.push(
      Prisma.sql`priority = ${filters.priority}::"ArticlePriority"`,
    );
  }
  const tsquery = filters.search ? toPrefixQuery(filters.search) : '';
  if (tsquery) {
    conditions.push(searchCondition(filters.search ?? '', tsquery));
  }
  return conditions.length > 0
    ? Prisma.join(conditions, ' AND ')
    : Prisma.sql`TRUE`;
}

function orderDirection(sort: ListFilters['sort']): Prisma.Sql {
  return sort === 'oldest' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
}

export function findById(db: TransactionClient, id: string) {
  return db.article.findUnique({ where: { id }, include: withRelations });
}

export async function list(
  db: TransactionClient,
  filters: ListFilters,
  page: { skip: number; take: number },
) {
  const tsquery = filters.search ? toPrefixQuery(filters.search) : '';
  if (!tsquery) {
    const [rows, total] = await Promise.all([
      db.article.findMany({
        where: whereFromFilters(filters),
        include: withRelations,
        orderBy: [{ updatedAt: filters.sort === 'oldest' ? 'asc' : 'desc' }],
        ...page,
      }),
      db.article.count({ where: whereFromFilters(filters) }),
    ]);
    return { rows, total };
  }

  const ranked = await db.$queryRaw<
    Array<{ id: string; total: bigint }>
  >(Prisma.sql`
    SELECT id, count(*) OVER() AS total
    FROM articles
    WHERE ${sqlWhere(filters)}
    ORDER BY ts_rank(search_vector, to_tsquery('simple', ${tsquery})) DESC,
             updated_at ${orderDirection(filters.sort)}
    OFFSET ${page.skip} LIMIT ${page.take}
  `);

  const total = ranked[0] ? Number(ranked[0].total) : 0;
  const ids = ranked.map((row) => row.id);
  if (ids.length === 0) {
    return { rows: [], total };
  }

  // Re-sorted into the ranking the raw query produced.
  const rows = await db.article.findMany({
    where: { id: { in: ids } },
    include: withRelations,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return {
    rows: ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [row] : [];
    }),
    total,
  };
}

export async function countByStatus(
  db: TransactionClient,
  filters: Omit<ListFilters, 'status'>,
): Promise<StatusCount[]> {
  if (!filters.search) {
    const grouped = await db.article.groupBy({
      by: ['status'],
      where: whereFromFilters(filters),
      _count: { _all: true },
    });
    return grouped.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  const rows = await db.$queryRaw<
    Array<{ status: ArticleStatus; count: bigint }>
  >(
    Prisma.sql`
      SELECT status, count(*) AS count
      FROM articles
      WHERE ${sqlWhere(filters)}
      GROUP BY status
    `,
  );
  return rows.map((row) => ({ status: row.status, count: Number(row.count) }));
}

export interface ArticleWriteData {
  categoryId: string;
  language: Language;
  headline: string;
  summary: string;
  content: object;
  contentText: string;
  youtubeUrl: string | null;
  tags: string[];
  priority: ArticlePriority;
  status: ArticleStatus;
  publicationDate: Date | null;
  mediaId: string | null;
  ogImageId: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
}

export function create(db: TransactionClient, data: ArticleWriteData) {
  return db.article.create({ data, include: withRelations });
}

export function update(
  db: TransactionClient,
  id: string,
  data: Partial<ArticleWriteData>,
) {
  return db.article.update({ where: { id }, data, include: withRelations });
}

export function remove(db: TransactionClient, id: string) {
  return db.article.delete({ where: { id }, select: { id: true } });
}

export function categoryExists(db: TransactionClient, categoryId: string) {
  return db.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
}

export function mediaExists(db: TransactionClient, mediaId: string) {
  return db.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
}
