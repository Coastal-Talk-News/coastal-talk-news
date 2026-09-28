import type { ImageLayoutDto, ImagePlacement } from '@coastal-talk-news/types';
import {
  IMAGE_WIDTH_MAX_PERCENT,
  IMAGE_WIDTH_MIN_PERCENT,
} from '@coastal-talk-news/validation/limits';

/** What the cover looks like until someone frames it. */
export const DEFAULT_LAYOUT: ImageLayoutDto = {
  widthPercent: IMAGE_WIDTH_MAX_PERCENT,
  placement: 'center',
  crop: null,
};

export function clampWidth(value: number): number {
  return Math.min(
    IMAGE_WIDTH_MAX_PERCENT,
    Math.max(IMAGE_WIDTH_MIN_PERCENT, Math.round(value)),
  );
}

const PLACEMENT_CLASSES: Record<ImagePlacement, string> = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
  'float-left': 'float-left mr-4',
  'float-right': 'float-right ml-4',
};

/** Where a framed picture sits in its column; the reader site draws the same. */
export function placementClass(placement: ImagePlacement): string {
  return PLACEMENT_CLASSES[placement];
}

/** Which edge of a picture moves when it is resized. A picture sitting against
 *  one side only grows away from it; a centred one grows from both. */
export function resizeEdges(
  placement: ImagePlacement,
): Array<'left' | 'right'> {
  if (placement === 'left' || placement === 'float-left') return ['right'];
  if (placement === 'right' || placement === 'float-right') return ['left'];
  return ['left', 'right'];
}
