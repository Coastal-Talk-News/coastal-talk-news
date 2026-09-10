import type { MediaAssetDto } from '@coastal-talk-news/types';
import { api, buildQuery, uploadFiles } from './client.js';

const BASE = '/api/v1/cms/media';

export interface MediaListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const mediaApi = {
  list: (params: MediaListParams, signal?: AbortSignal) =>
    api.list<MediaAssetDto>(`${BASE}${buildQuery({ ...params })}`, signal),

  uploadOne: (file: File, onProgress?: (percent: number) => void) =>
    uploadFiles<MediaAssetDto[]>(BASE, [file], onProgress).then((assets) => {
      const asset = assets[0];
      if (!asset) throw new Error('Upload did not return an image.');
      return asset;
    }),

  remove: (id: string) => api.send(`${BASE}/${id}`, 'DELETE'),

  cleanup: () => api.post<{ removed: number }>(`${BASE}/cleanup`),
};
