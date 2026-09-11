import type { MediaAssetDto } from '@coastal-talk-news/types';
import type { MediaUsage } from './reference.js';

export interface MediaAssetRow {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: Date;
}

const NO_USAGE: MediaUsage = {
  articles: 0,
  categories: 0,
  advertisements: 0,
  settings: 0,
  total: 0,
};

export interface UrlBuilder {
  (storageKey: string, options?: { width?: number }): string;
}

export function toMediaAssetDto(
  asset: MediaAssetRow,
  toPublicUrl: UrlBuilder,
  usage: MediaUsage = NO_USAGE,
): MediaAssetDto {
  return {
    id: asset.id,
    url: toPublicUrl(asset.storageKey),
    thumbnailUrl: toPublicUrl(asset.storageKey, { width: 600 }),
    filename: asset.filename,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    createdAt: asset.createdAt.toISOString(),
    usage,
  };
}
