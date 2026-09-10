import type {
  AdvertisementDto,
  AdvertisementListParams,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
} from '@coastal-talk-news/types';
import { api, buildQuery } from './client.js';

const BASE = '/api/v1/cms/advertisements';

export const advertisementsApi = {
  list: (params: AdvertisementListParams, signal?: AbortSignal) =>
    api.list<AdvertisementDto>(`${BASE}${buildQuery({ ...params })}`, signal),

  create: (body: CreateAdvertisementRequest) =>
    api.post<AdvertisementDto>(BASE, body),

  update: (id: string, body: UpdateAdvertisementRequest) =>
    api.patch<AdvertisementDto>(`${BASE}/${id}`, body),

  remove: (id: string) => api.send(`${BASE}/${id}`, 'DELETE'),
};
