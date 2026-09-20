import type { Id, IsoDateTime, RichTextContent } from './api.js';
import type { MediaSummaryDto } from './media.js';

/**
 * Each zone is sold separately, which is why placement is a field rather than
 * a rendering detail: MASTHEAD is the single premium slot beside the site name,
 * TOP the band under the header (3 slots), SIDEBAR the uncapped rail.
 */
export type AdPlacement = 'MASTHEAD' | 'TOP' | 'SIDEBAR';

/**
 * How a creative is framed inside the slot the advertiser bought. The slot's
 * size is fixed - what the CMS sets is where the artwork sits in it, by
 * dragging and zooming it the way a profile-picture cropper works.
 */
export interface AdImageCrop {
  /** 100 fits the whole image in the slot; above that the slot crops it. */
  zoom: number;
  /** Pan, as a percentage of the slot's width and height. 0/0 is centred. */
  offsetX: number;
  offsetY: number;
}

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
  /** Position within its own placement zone, ascending. Set only by dragging
   *  to reorder in the CMS - Top and Sidebar are ordered independently. */
  displayOrder: number;
  placement: AdPlacement;
  zoom: number;
  offsetX: number;
  offsetY: number;
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
  /** Omit to append to the end of the zone; set only by the reorder call. */
  displayOrder?: number;
  /** Defaults to SIDEBAR server-side when omitted. */
  placement?: AdPlacement;
  /** Omit for an untouched frame: the whole image, centred. */
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
}

export type UpdateAdvertisementRequest = Partial<CreateAdvertisementRequest>;

export interface AdvertisementListParams {
  page?: number;
  limit?: number;
}
