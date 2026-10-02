import type {
  MediaAssetDto,
  MediaUploadSignatureDto,
  RegisterMediaRequest,
} from '@coastal-talk-news/types';
import { compressImage } from '../lib/compressImage.js';
import { api, ApiError, buildQuery } from './client.js';
import { uploadToCloudinary } from './cloudinaryUpload.js';

const BASE = '/api/v1/cms/media';

export interface MediaListParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Compress → sign → upload straight to Cloudinary → register. The raw bytes
 * only ever travel from this browser to Cloudinary; our own server sees a
 * signature request and, afterwards, a small JSON confirmation - never the
 * image itself.
 *
 * Progress is weighted across the stages so the bar moves the whole time
 * rather than sitting at 0% through compression and then jumping to 100%:
 * compression and the signature request are quick and get a small slice
 * each, the Cloudinary upload (the real work) gets the rest.
 */
async function uploadOne(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaAssetDto> {
  try {
    onProgress?.(0);
    const compressed = await compressImage(file);

    onProgress?.(5);
    const signature = await api.post<MediaUploadSignatureDto>(
      `${BASE}/signature`,
    );

    onProgress?.(10);
    const { publicId } = await uploadToCloudinary(
      compressed,
      signature,
      (percent) => onProgress?.(10 + Math.round(percent * 0.85)),
    );

    const body: RegisterMediaRequest = { publicId, filename: file.name };
    const asset = await api.post<MediaAssetDto>(BASE, body);
    onProgress?.(100);
    return asset;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, {
      code: 'UPLOAD_FAILED',
      message: error instanceof Error ? error.message : 'Upload failed.',
    });
  }
}

export const mediaApi = {
  list: (params: MediaListParams, signal?: AbortSignal) =>
    api.list<MediaAssetDto>(`${BASE}${buildQuery({ ...params })}`, signal),

  uploadOne,

  remove: (id: string) => api.send(`${BASE}/${id}`, 'DELETE'),

  cleanup: () => api.post<{ removed: number }>(`${BASE}/cleanup`),
};
