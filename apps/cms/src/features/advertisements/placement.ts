import type { AdPlacement, AdvertisementDto } from '@coastal-talk-news/types';

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
    hint: 'Beside the site name. Wide banner.',
    tone: 'amber',
    capacity: 1,
    slot: { width: 520, height: 96 },
  },
  TOP: {
    label: 'Top',
    hint: 'Band under the header. Three slots share the row.',
    tone: 'blue',
    capacity: 3,
    slot: { width: 408, height: 88 },
  },
  SIDEBAR: {
    label: 'Right Side',
    hint: '250 x 300 rail. No limit.',
    tone: 'slate',
  },
};

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
