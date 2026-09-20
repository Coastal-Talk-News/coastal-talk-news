import type { AdPlacement } from '@coastal-talk-news/db';
import type {
  AdvertisementDto,
  MediaSummaryDto,
  RichTextContent,
} from '@coastal-talk-news/types';
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
  destinationUrl: string | null;
  description: unknown;
  displayOrder: number;
  placement: AdPlacement;
  zoom: number;
  offsetX: number;
  offsetY: number;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
  updatedAt: Date;
  media: MediaRow;
  detailMedia: MediaRow | null;
}

export type ToPublicUrl = (storageKey: string) => string;

export function toMediaSummary(
  media: MediaRow,
  toPublicUrl: ToPublicUrl,
): MediaSummaryDto {
  return {
    id: media.id,
    url: toPublicUrl(media.storageKey),
    width: media.width,
    height: media.height,
  };
}

/**
 * Prisma types a Json column as unknown, so the document is narrowed here once
 * rather than at every call site. It was schema-checked on the way in.
 */
export function toRichText(value: unknown): RichTextContent | null {
  return value ? (value as RichTextContent) : null;
}

export function toAdvertisementDto(
  item: AdvertisementEntity,
  toPublicUrl: ToPublicUrl,
  now: Date = new Date(),
): AdvertisementDto {
  const { isActive } = withIsActive(item, now);
  return {
    id: item.id,
    advertiserName: item.advertiserName,
    image: toMediaSummary(item.media, toPublicUrl),
    detailImage: item.detailMedia
      ? toMediaSummary(item.detailMedia, toPublicUrl)
      : null,
    description: toRichText(item.description),
    destinationUrl: item.destinationUrl,
    displayOrder: item.displayOrder,
    placement: item.placement,
    zoom: item.zoom,
    offsetX: item.offsetX,
    offsetY: item.offsetY,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt.toISOString(),
    isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
