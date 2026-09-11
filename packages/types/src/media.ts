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
