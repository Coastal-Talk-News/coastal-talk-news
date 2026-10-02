import type {
  AnalyticsArticleDto,
  AnalyticsDailyViewsDto,
  AnalyticsMonthlyViewsDto,
  AnalyticsSort,
  AnalyticsStatsDto,
  AnalyticsYearRangeDto,
  SortOrder,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

export const analyticsApi = {
  stats: (signal?: AbortSignal) =>
    api.get<AnalyticsStatsDto>('/api/v1/cms/analytics', signal),
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
  weekViews: (weeksAgo: number, signal?: AbortSignal) =>
    api.get<AnalyticsDailyViewsDto[]>(
      `/api/v1/cms/analytics/views/week${buildQuery({ weeksAgo })}`,
      signal,
    ),
  monthViews: (year: number, month: number, signal?: AbortSignal) =>
    api.get<AnalyticsDailyViewsDto[]>(
      `/api/v1/cms/analytics/views/month${buildQuery({ year, month })}`,
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
