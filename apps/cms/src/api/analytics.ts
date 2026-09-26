import type {
  AnalyticsArticleDto,
  AnalyticsStatsDto,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

export const analyticsApi = {
  stats: (signal?: AbortSignal) =>
    api.get<AnalyticsStatsDto>('/api/v1/cms/analytics', signal),
  articles: (page: number, limit: number, signal?: AbortSignal) =>
    api.list<AnalyticsArticleDto>(
      `/api/v1/cms/analytics/articles${buildQuery({ page, limit })}`,
      signal,
    ),
};
