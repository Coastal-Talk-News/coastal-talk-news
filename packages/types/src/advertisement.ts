import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

/** TOP is a fixed 242×90 band capped at 3 active ads; SIDEBAR is a fixed 250×300 rail, uncapped. */
export type AdPlacement = 'TOP' | 'SIDEBAR';

export interface AdvertisementDto {
  id: Id;
  advertiserName: string;
  image: MediaSummaryDto;
  destinationUrl: string;
  priority: number;
  placement: AdPlacement;
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
  /** Defaults to SIDEBAR server-side when omitted. */
  placement?: AdPlacement;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
}

export type UpdateAdvertisementRequest = Partial<CreateAdvertisementRequest>;

export interface AdvertisementListParams {
  page?: number;
  limit?: number;
}
