import type { AdvertisementDto } from '@coastal-talk-news/types';

export type AdvertisementStatus = 'active' | 'scheduled' | 'expired';

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
