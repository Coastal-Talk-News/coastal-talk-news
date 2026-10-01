import type {
  AnalyticsArticleDto,
  AnalyticsDailyViewsDto,
  AnalyticsMonthlyViewsDto,
  AnalyticsSort,
  AnalyticsStatsDto,
  AnalyticsWeeklyViewsDto,
  AnalyticsYearRangeDto,
  DatabaseStorageDto,
  SortOrder,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

export const analyticsApi = {
  stats: (signal?: AbortSignal) =>
    api.get<AnalyticsStatsDto>('/api/v1/cms/analytics', signal),
  storage: (signal?: AbortSignal) =>
    api.get<DatabaseStorageDto>('/api/v1/cms/analytics/storage', signal),
  articles: (
    params: {
      page: number;
      limit: number;
      sort: AnalyticsSort;
      order: SortOrder;
    },
    signal?: AbortSignal,
  ) =>
    api.list<AnalyticsArticleDto>(
      `/api/v1/cms/analytics/articles${buildQuery(params)}`,
      signal,
    ),
  dailyViews: (signal?: AbortSignal) =>
    api.get<AnalyticsDailyViewsDto[]>(
      '/api/v1/cms/analytics/views/daily',
      signal,
    ),
  weeklyViews: (signal?: AbortSignal) =>
    api.get<AnalyticsWeeklyViewsDto[]>(
      '/api/v1/cms/analytics/views/weekly',
      signal,
    ),
  monthlyViews: (year: number, signal?: AbortSignal) =>
    api.get<AnalyticsMonthlyViewsDto[]>(
      `/api/v1/cms/analytics/views/monthly${buildQuery({ year })}`,
      signal,
    ),
  yearRange: (signal?: AbortSignal) =>
    api.get<AnalyticsYearRangeDto>('/api/v1/cms/analytics/views/years', signal),
};
