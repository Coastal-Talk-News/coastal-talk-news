import type { Id, IsoDateTime, RichTextContent } from './api.js';
import type { MediaSummaryDto } from './media.js';

/**
 * Each zone is sold separately, which is why placement is a field rather than
 * a rendering detail: MASTHEAD is the single premium slot beside the site name,
 * TOP the band under the header (4 slots), SIDEBAR the uncapped rail.
 */
export type AdPlacement = 'MASTHEAD' | 'TOP' | 'SIDEBAR';

/**
 * Masthead and Top ads only - Sidebar never reads this, since it sets width
 * alone and lets height follow the artwork, so there's never a gap to
 * resolve. Independent of zoom/offset below: the admin can zoom a Masthead
 * or Top ad to any amount, from the whole image up past a full cover, in
 * any of these three modes. Zooming far enough always closes the gap on
 * its own; this only decides what happens on whatever's left over at
 * whatever zoom the admin actually picked, never one hard-coded behaviour
 * for every ad:
 *   FIT_SHRINK    the slot itself sizes down to match whatever is actually
 *                 drawn at the current zoom, so no leftover space is ever
 *                 shown - the slot shrinks instead of a gap appearing.
 *   FIT_SPACE     the slot stays at its full fixed size and whatever isn't
 *                 covered at the current zoom is left plainly empty.
 *   FIT_BACKGROUND  the same as FIT_SPACE, but the leftover space is filled
 *                 with a softly blurred, enlarged copy of the same creative.
 */
export type AdFitMode = 'FIT_SHRINK' | 'FIT_SPACE' | 'FIT_BACKGROUND';

/**
 * How a creative is framed inside the slot the advertiser bought. The slot's
 * size is fixed - what the CMS sets is where the artwork sits in it, by
 * dragging and zooming it the way a profile-picture cropper works. Always
 * meaningful for every Masthead and Top ad, regardless of its fitMode -
 * fitMode only decides what happens to whatever this crop doesn't cover.
 */
export interface AdImageCrop {
  /** 100 fits the whole image in the slot; above that the slot crops it. */
  zoom: number;
  /** Pan, as a percentage of the slot's width and height. 0/0 is centred. */
  offsetX: number;
  offsetY: number;
}

export interface AdSlotSize {
  width: number;
  height: number;
}

export const AD_ZOOM_MIN = 100;
/**
 * High enough that an admin who *chooses* "Fill slot" can always actually
 * reach it, for any fixed slot this app has: a perfectly square image in the
 * widest one (Masthead, 520x96) needs ~542% to cover it with no gap left
 * over. A lower cap would silently refuse that choice for some images - this
 * only raises the available range; nothing is forced into it.
 */
export const AD_ZOOM_MAX = 600;

export const DEFAULT_AD_CROP: AdImageCrop = {
  zoom: 100,
  offsetX: 0,
  offsetY: 0,
};

/** The size the artwork is drawn at before any zoom: the whole of it, inside
 *  the slot, which is what object-contain gives the reader site. */
function containedSize(image: AdSlotSize, slot: AdSlotSize): AdSlotSize {
  const scale = Math.min(slot.width / image.width, slot.height / image.height);
  return { width: image.width * scale, height: image.height * scale };
}

/**
 * The zoom at which the artwork covers the slot with nothing left over -
 * what the CMS's "Fill slot" button offers as one option, alongside "whole
 * image" (zoom 100, no crop). Which one the ad actually uses is entirely the
 * admin's call per ad; nothing applies this as a floor over their choice.
 */
export function coverZoom(image: AdSlotSize, slot: AdSlotSize): number {
  const drawn = containedSize(image, slot);
  return Math.min(
    AD_ZOOM_MAX,
    Math.ceil(
      100 * Math.max(slot.width / drawn.width, slot.height / drawn.height),
    ),
  );
}

/**
 * What FIT_SHRINK draws: the actual visible size of the artwork at the
 * given zoom, capped to the slot on each axis independently. Below
 * coverZoom one axis is still smaller than the slot (that's the leftover
 * space the other two fit modes show or fill); at or past it, both axes
 * are already at least slot-sized, so this simply returns the slot itself.
 */
export function visibleAdBox(
  image: AdSlotSize,
  slot: AdSlotSize,
  zoom: number,
): AdSlotSize {
  const contained = containedSize(image, slot);
  return {
    width: Math.min(slot.width, (contained.width * zoom) / 100),
    height: Math.min(slot.height, (contained.height * zoom) / 100),
  };
}

function clamp(value: number, limit: number): number {
  return Math.round(Math.min(limit, Math.max(-limit, value)));
}

/**
 * Keeps the frame honest: the zoom stays in range, and the artwork can only
 * be panned as far as it actually overflows the slot, so a drag can never
 * leave a gap the admin didn't ask for or push the image out of view.
 */
export function clampAdCrop(
  crop: AdImageCrop,
  image: AdSlotSize,
  slot: AdSlotSize,
): AdImageCrop {
  const zoom = Math.round(
    Math.min(AD_ZOOM_MAX, Math.max(AD_ZOOM_MIN, crop.zoom)),
  );
  const drawn = containedSize(image, slot);
  const limitX = Math.max(
    0,
    50 * ((drawn.width * zoom) / 100 / slot.width - 1),
  );
  const limitY = Math.max(
    0,
    50 * ((drawn.height * zoom) / 100 / slot.height - 1),
  );
  return {
    zoom,
    offsetX: clamp(crop.offsetX, limitX),
    offsetY: clamp(crop.offsetY, limitY),
  };
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
  /** Masthead and Top only; always FIT_SHRINK for Sidebar. Independent of
   *  zoom/offsetX/offsetY below - see AdFitMode. */
  fitMode: AdFitMode;
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
  /** Masthead and Top only; ignored for Sidebar. Defaults to FIT_SHRINK.
   *  Independent of zoom/offsetX/offsetY below. */
  fitMode?: AdFitMode;
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
