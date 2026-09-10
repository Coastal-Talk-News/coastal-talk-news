import type {
  BreakingNewsDto,
  CreateBreakingNewsRequest,
  UpdateBreakingNewsRequest,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

const BASE = '/api/v1/cms/breaking-news';

export interface BreakingNewsListParams {
  page?: number;
  limit?: number;
}

export const breakingNewsApi = {
  list: (params: BreakingNewsListParams, signal?: AbortSignal) =>
    api.list<BreakingNewsDto>(`${BASE}${buildQuery({ ...params })}`, signal),

  create: (body: CreateBreakingNewsRequest) =>
    api.post<BreakingNewsDto>(BASE, body),

  update: (id: string, body: UpdateBreakingNewsRequest) =>
    api.patch<BreakingNewsDto>(`${BASE}/${id}`, body),

  remove: (id: string) => api.send(`${BASE}/${id}`, 'DELETE'),
};
