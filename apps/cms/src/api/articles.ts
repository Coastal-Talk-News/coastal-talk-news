import type {
  ArticleDto,
  ArticleListParams,
  ArticleStatusCountsDto,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

const BASE = '/api/v1/cms/articles';

export const articlesApi = {
  list: (params: ArticleListParams, signal?: AbortSignal) =>
    api.list<ArticleDto>(`${BASE}${buildQuery({ ...params })}`, signal),

  counts: (
    params: Omit<ArticleListParams, 'page' | 'limit' | 'status'>,
    signal?: AbortSignal,
  ) =>
    api.get<ArticleStatusCountsDto>(
      `${BASE}/counts${buildQuery({ ...params })}`,
      signal,
    ),

  get: (id: string, signal?: AbortSignal) =>
    api.get<ArticleDto>(`${BASE}/${id}`, signal),

  create: (body: CreateArticleRequest) => api.post<ArticleDto>(BASE, body),

  update: (id: string, body: UpdateArticleRequest) =>
    api.patch<ArticleDto>(`${BASE}/${id}`, body),

  remove: (id: string) => api.send(`${BASE}/${id}`, 'DELETE'),
};
