import type { DashboardDto } from '@coastal-talk-news/types';
import { api } from './client.js';

export const dashboardApi = {
  get: (signal?: AbortSignal) =>
    api.get<DashboardDto>('/api/v1/cms/dashboard', signal),
};
