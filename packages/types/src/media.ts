import type { Id, IsoDateTime } from './api.js';

/** Media as embedded in another resource, carrying the URL a client renders. */
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
