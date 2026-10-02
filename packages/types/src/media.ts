import type { Id, IsoDateTime } from './api.js';

export interface MediaSummaryDto {
  id: Id;
  url: string;
  width: number;
  height: number;
}

export interface MediaUsageDto {
  articles: number;
  categories: number;
  advertisements: number;
  settings: number;
  total: number;
}

/** A time-boxed ticket for uploading one image straight to Cloudinary. */
export interface MediaUploadSignatureDto {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  allowedFormats: string;
}

export interface RegisterMediaRequest {
  publicId: string;
  filename: string;
}

export interface MediaAssetDto {
  id: Id;
  url: string;
  thumbnailUrl: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: IsoDateTime;
  usage: MediaUsageDto;
}

/**
 * How an image sits in an article. `float-*` lets the text wrap around it; the
 * rest keep it on a line of its own. One value rather than an alignment plus a
 * wrap flag, so a contradictory pair cannot be stored.
 */
export type ImagePlacement =
  'left' | 'center' | 'right' | 'float-left' | 'float-right';

/** A region of the original picture, each value a fraction from 0 to 1. */
export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageLayoutDto {
  /** Share of the article column the image takes up. */
  widthPercent: number;
  placement: ImagePlacement;
  /** Null shows the whole picture. */
  crop: ImageCrop | null;
}
