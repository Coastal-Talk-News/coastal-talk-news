import type { DashboardDto, DashboardUsageDto } from '@coastal-talk-news/types';
import { api } from './client.js';

export const dashboardApi = {
  get: (signal?: AbortSignal) =>
    api.get<DashboardDto>('/api/v1/cms/dashboard', signal),
  usage: (signal?: AbortSignal) =>
    api.get<DashboardUsageDto>('/api/v1/cms/dashboard/usage', signal),
};
