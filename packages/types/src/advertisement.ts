import type { Id, IsoDateTime, RichTextContent } from './api.js';
import type { MediaSummaryDto } from './media.js';

/**
 * Each zone is sold separately, which is why placement is a field rather than
 * a rendering detail: MASTHEAD is the single premium slot beside the site name,
 * TOP the band under the header (3 slots), SIDEBAR the uncapped rail.
 */
export type AdPlacement = 'MASTHEAD' | 'TOP' | 'SIDEBAR';

export interface AdvertisementDto {
  id: Id;
  advertiserName: string;
  image: MediaSummaryDto;
  /** Larger creative for the ad's own page; the banner is used when absent. */
  detailImage: MediaSummaryDto | null;
  /** Long-form copy for the ad's own page. */
  description: RichTextContent | null;
  /** Null when the advertiser has no site of their own to link to. */
  destinationUrl: string | null;
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
  detailMediaId?: Id | null;
  description?: RichTextContent | null;
  destinationUrl?: string | null;
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
