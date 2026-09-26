export const queryKeys = {
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  twoFactor: ['two-factor'] as const,
  dashboard: ['dashboard'] as const,
  // Apart from `dashboard`, so saving an article does not refetch it: the
  // figures only move on a scale of minutes.
  dashboardUsage: ['dashboard-usage'] as const,
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
  analytics: ['analytics'] as const,
  analyticsArticles: (page: number) => ['analytics', 'articles', page] as const,
} as const;
