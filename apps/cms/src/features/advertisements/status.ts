import type { AdvertisementDto } from '@coastal-talk-news/types';

export type AdvertisementStatus = 'active' | 'scheduled' | 'expired';

/**
 * Derived from startAt/endAt only — never from the DTO's isActive field.
 * isActive is a snapshot from whenever the item was last fetched, so an item
 * sitting at a boundary wouldn't flip in the CMS until something refetched
 * the list. Recomputing from the raw timestamps against a live `now` lets the
 * status change on screen without a page refresh, while still deriving
 * everything at read time rather than storing it (CLAUDE.md §13).
 */
export function advertisementStatusValue(
  item: Pick<AdvertisementDto, 'startAt' | 'endAt'>,
  now: Date = new Date(),
): AdvertisementStatus {
  const nowMs = now.getTime();
  if (nowMs < new Date(item.startAt).getTime()) return 'scheduled';
  if (nowMs > new Date(item.endAt).getTime()) return 'expired';
  return 'active';
}

const LABELS: Record<AdvertisementStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
};

// No violet tone in the shared Badge component — reuses the same blue
// Breaking News already uses for Scheduled, rather than adding one just for
// pixel-matching the design.
const TONES: Record<AdvertisementStatus, 'green' | 'blue' | 'slate'> = {
  active: 'green',
  scheduled: 'blue',
  expired: 'slate',
};

export function advertisementStatus(
  item: AdvertisementDto,
  now: Date = new Date(),
) {
  const value = advertisementStatusValue(item, now);
  return { value, label: LABELS[value], tone: TONES[value] };
}
