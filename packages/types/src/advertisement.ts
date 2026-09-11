import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

export interface AdvertisementDto {
  id: Id;
  advertiserName: string;
  image: MediaSummaryDto;
  destinationUrl: string;
  priority: number;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CreateAdvertisementRequest {
  advertiserName: string;
  mediaId: Id;
  destinationUrl: string;
  priority?: number;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
}

export type UpdateAdvertisementRequest = Partial<CreateAdvertisementRequest>;

export interface AdvertisementListParams {
  page?: number;
  limit?: number;
}
