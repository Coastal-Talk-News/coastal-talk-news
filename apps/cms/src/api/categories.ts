import type {
  CmsCategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

const BASE = '/api/v1/cms/categories';

export interface CategoryListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const categoriesApi = {
  list: (params: CategoryListParams, signal?: AbortSignal) =>
    api.list<CmsCategoryDto>(`${BASE}${buildQuery({ ...params })}`, signal),

  create: (body: CreateCategoryRequest) => api.post<CmsCategoryDto>(BASE, body),

  update: (id: string, body: UpdateCategoryRequest) =>
    api.patch<CmsCategoryDto>(`${BASE}/${id}`, body),

  reorder: (parentId: string | null, ids: string[]) =>
    api.send(`${BASE}/order`, 'PATCH', { parentId, ids }),

  remove: (id: string) => api.send(`${BASE}/${id}`, 'DELETE'),
};
