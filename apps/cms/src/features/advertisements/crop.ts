import type { AdImageCrop, MediaSummaryDto } from '@coastal-talk-news/types';

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 300;

export const DEFAULT_CROP: AdImageCrop = { zoom: 100, offsetX: 0, offsetY: 0 };

interface Size {
  width: number;
  height: number;
}

/** The size the artwork is drawn at before any zoom: the whole of it, inside
 *  the slot, which is what object-contain gives the reader site. */
function containedSize(image: Size, slot: Size): Size {
  const scale = Math.min(slot.width / image.width, slot.height / image.height);
  return { width: image.width * scale, height: image.height * scale };
}

/** The zoom at which the artwork covers the slot with nothing left over. */
export function coverZoom(image: MediaSummaryDto, slot: Size): number {
  const drawn = containedSize(image, slot);
  return Math.min(
    ZOOM_MAX,
    Math.ceil(
      100 * Math.max(slot.width / drawn.width, slot.height / drawn.height),
    ),
  );
}

function clamp(value: number, limit: number): number {
  return Math.round(Math.min(limit, Math.max(-limit, value)));
}

/**
 * Keeps the frame honest: the zoom stays in range, and the artwork can only
 * be panned as far as it actually overflows the slot, so a drag can never
 * leave a gap the admin didn't ask for or push the image out of view.
 */
export function clampCrop(
  crop: AdImageCrop,
  image: MediaSummaryDto,
  slot: Size,
): AdImageCrop {
  const zoom = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, crop.zoom)));
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
