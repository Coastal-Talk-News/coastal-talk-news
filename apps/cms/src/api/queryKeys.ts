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
  // The public /site endpoint, not the authenticated settings one above -
  // used for branding (logo, site name) on screens rendered before sign-in.
  siteBrand: ['site-brand'] as const,
  analytics: ['analytics'] as const,
  seoHealth: ['seo-health'] as const,
  // Under seoHealth, so refreshing the checks refreshes this list too.
  seoArticles: (params: Record<string, unknown>) =>
    ['seo-health', 'articles', params] as const,
  analyticsArticles: (params: Record<string, unknown>) =>
    ['analytics', 'articles', params] as const,
  analyticsWeekViews: (weeksAgo: number) =>
    ['analytics', 'views', 'week', weeksAgo] as const,
  analyticsMonthViews: (year: number, month: number) =>
    ['analytics', 'views', 'month', year, month] as const,
  analyticsMonthlyViews: (year: number) =>
    ['analytics', 'views', 'monthly', year] as const,
  analyticsYearRange: ['analytics', 'views', 'years'] as const,
} as const;
