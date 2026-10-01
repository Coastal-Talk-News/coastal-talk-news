import type {
  AnalyticsArticleDto,
  AnalyticsStatsDto,
  DatabaseStorageDto,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

export const analyticsApi = {
  stats: (signal?: AbortSignal) =>
    api.get<AnalyticsStatsDto>('/api/v1/cms/analytics', signal),
  storage: (signal?: AbortSignal) =>
    api.get<DatabaseStorageDto>('/api/v1/cms/analytics/storage', signal),
  articles: (page: number, limit: number, signal?: AbortSignal) =>
    api.list<AnalyticsArticleDto>(
      `/api/v1/cms/analytics/articles${buildQuery({ page, limit })}`,
      signal,
    ),
};
