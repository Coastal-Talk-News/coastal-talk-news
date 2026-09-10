/**
 * Every cache key in one place. Raw arrays at call sites drift, and a mismatch
 * fails silently — the query simply never invalidates.
 */
export const queryKeys = {
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  dashboard: ['dashboard'] as const,
  categories: ['categories'] as const,
  media: ['media'] as const,
  mediaList: (params: Record<string, unknown>) => ['media', params] as const,
  categoryList: (params: Record<string, unknown>) =>
    ['categories', params] as const,
  breakingNews: ['breaking-news'] as const,
  breakingNewsList: (params: Record<string, unknown>) =>
    ['breaking-news', params] as const,
  articles: ['articles'] as const,
  articleList: (params: Record<string, unknown>) =>
    ['articles', 'list', params] as const,
  articleCounts: (params: Record<string, unknown>) =>
    ['articles', 'counts', params] as const,
  article: (id: string) => ['articles', 'detail', id] as const,
  advertisements: ['advertisements'] as const,
  advertisementList: (params: Record<string, unknown>) =>
    ['advertisements', params] as const,
  settings: ['settings'] as const,
} as const;
