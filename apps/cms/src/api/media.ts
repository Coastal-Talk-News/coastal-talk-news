import type {
  MediaAssetDto,
  MediaUploadTicketDto,
  RegisterMediaRequest,
} from '@coastal-talk-news/types';
import { compressImage } from '../lib/compressImage.js';
import { api, ApiError, buildQuery } from './client.js';
import { uploadToCloudinary } from './cloudinaryUpload.js';
import { uploadToS3 } from './s3Upload.js';

const BASE = '/api/v1/cms/media';

export interface MediaListParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Compress → sign → upload straight to storage → register. The raw bytes
 * only ever travel from this browser to whichever backend `STORAGE_PROVIDER`
 * selects on the server; our own API only ever sees a ticket request and,
 * afterwards, a small JSON confirmation - never the image itself.
 *
 * Which storage backend is live is entirely the ticket's `provider` field -
 * this function is the one place that branches on it; everything else
 * (compression, progress reporting, the register call) is identical either
 * way.
 *
 * Progress is weighted across the stages so the bar moves the whole time
 * rather than sitting at 0% through compression and then jumping to 100%:
 * compression and the ticket request are quick and get a small slice each,
 * the actual upload (the real work) gets the rest.
 */
async function uploadOne(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaAssetDto> {
  try {
    onProgress?.(0);
    const compressed = await compressImage(file);

    onProgress?.(5);
    const ticket = await api.post<MediaUploadTicketDto>(`${BASE}/signature`, {
      contentType: compressed.file.type,
    });

    onProgress?.(10);
    const onUploadProgress = (percent: number) =>
      onProgress?.(10 + Math.round(percent * 0.85));
    const storageKey =
      ticket.provider === 'cloudinary'
        ? (await uploadToCloudinary(compressed.file, ticket, onUploadProgress))
            .publicId
        : (await uploadToS3(compressed.file, ticket, onUploadProgress))
            .storageKey;

    const body: RegisterMediaRequest = {
      storageKey,
      filename: file.name,
      ...(compressed.width && compressed.height
        ? { width: compressed.width, height: compressed.height }
        : {}),
    };
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
