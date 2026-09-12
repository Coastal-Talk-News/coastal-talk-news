import type { AdPlacement } from '@coastal-talk-news/db';
import type { AdvertisementDto } from '@coastal-talk-news/types';
import { withIsActive } from '../../lib/schedule.js';

interface MediaRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

export interface AdvertisementEntity {
  id: string;
  advertiserName: string;
  destinationUrl: string;
  priority: number;
  placement: AdPlacement;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
  updatedAt: Date;
  media: MediaRow;
}

export type ToPublicUrl = (storageKey: string) => string;

export function toAdvertisementDto(
  item: AdvertisementEntity,
  toPublicUrl: ToPublicUrl,
  now: Date = new Date(),
): AdvertisementDto {
  const { isActive } = withIsActive(item, now);
  return {
    id: item.id,
    advertiserName: item.advertiserName,
    image: {
      id: item.media.id,
      url: toPublicUrl(item.media.storageKey),
      width: item.media.width,
      height: item.media.height,
    },
    destinationUrl: item.destinationUrl,
    priority: item.priority,
    placement: item.placement,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt.toISOString(),
    isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
