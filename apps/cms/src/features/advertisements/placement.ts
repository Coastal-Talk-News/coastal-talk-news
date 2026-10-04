import type {
  AdFitMode,
  AdPlacement,
  AdvertisementDto,
} from '@coastal-talk-news/types';

interface PlacementMeta {
  label: string;
  /** Shown under the label in the picker, and as the upload size hint. */
  hint: string;
  tone: 'amber' | 'blue' | 'slate';
  /** How many ads may run at once. Absent means unlimited. */
  capacity?: number;
  /**
   * The reader-site slot, used to frame the creative in the shape it is
   * actually shown in. The shape is what matters and what the reader site
   * holds at every width - these numbers are that slot at full size. Absent
   * where the zone fixes width alone and lets height follow the artwork, so
   * nothing is ever cropped and there is nothing to frame. Mirrors the
   * constants in the web app's MastheadAd and AdBand components.
   */
  slot?: { width: number; height: number };
}

export const PLACEMENTS: AdPlacement[] = ['MASTHEAD', 'TOP', 'SIDEBAR'];

export const PLACEMENT_META: Record<AdPlacement, PlacementMeta> = {
  MASTHEAD: {
    label: 'Masthead',
    hint: 'Beside the site name. Wide banner. Best at 520 × 96px - any size works, you can crop and zoom to fit.',
    tone: 'amber',
    capacity: 1,
    slot: { width: 520, height: 96 },
  },
  TOP: {
    label: 'Top',
    hint: 'Band under the header. Up to four slots share the row. Best at 408 × 88px - any size works, you can crop and zoom to fit.',
    tone: 'blue',
    capacity: 4,
    slot: { width: 408, height: 88 },
  },
  SIDEBAR: {
    label: 'Right Side',
    hint: '250px wide rail, no limit on how many run. Best at 250 x 300px or taller - width is fixed and height follows your image, uncropped.',
    tone: 'slate',
  },
};

export const DEFAULT_AD_FIT_MODE: AdFitMode = 'FIT_SHRINK';

/** Masthead and Top are the two zones with a fixed slot shape to frame a
 *  creative against - Sidebar sets width alone and lets height follow the
 *  artwork, so there's never a gap for a fit mode to resolve. */
export function offersFitMode(placement: AdPlacement): boolean {
  return placement === 'MASTHEAD' || placement === 'TOP';
}

/**
 * Masthead and Top ads only, shown in this order (preferred option first).
 * Independent of the crop/zoom above - zooming far enough always closes
 * the gap on its own; this only decides what happens to whatever is still
 * left over at whatever zoom the admin actually lands on.
 */
export const FIT_MODE_OPTIONS: Array<{
  value: AdFitMode;
  label: string;
  hint: string;
}> = [
  {
    value: 'FIT_SHRINK',
    label: 'Shrink to fit',
    hint: 'The slot shrinks to match whatever is actually drawn at the current zoom, so no empty space ever shows.',
  },
  {
    value: 'FIT_SPACE',
    label: 'Keep slot size',
    hint: 'The slot stays full size; whatever the current zoom doesn’t cover is left empty.',
  },
  {
    value: 'FIT_BACKGROUND',
    label: 'Blurred background',
    hint: 'The slot stays full size; whatever the current zoom doesn’t cover is filled with a soft, blurred copy of the same image.',
  },
];

/**
 * Mirrors the server's rule: a zone's slots are only taken by ads whose run
 * overlaps this one's, so the same slot can be re-sold for a later period.
 * The server is still the gate - this only keeps the form from offering a
 * choice that is already known to be rejected.
 */
export function overlappingInPlacement(
  advertisements: AdvertisementDto[],
  placement: AdPlacement,
  window: { startAt: string; endAt: string },
  excludeId?: string,
): number {
  const start = new Date(window.startAt).getTime();
  const end = new Date(window.endAt).getTime();

  return advertisements.filter(
    (ad) =>
      ad.placement === placement &&
      ad.id !== excludeId &&
      new Date(ad.startAt).getTime() <= end &&
      new Date(ad.endAt).getTime() >= start,
  ).length;
}
