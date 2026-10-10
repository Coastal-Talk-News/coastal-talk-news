import type { AdFitMode, AdPlacement } from '@coastal-talk-news/db';
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
  descriptionKannada: unknown;
  displayOrder: number;
  placement: AdPlacement;
  fitMode: AdFitMode;
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
    descriptionKannada: toRichText(item.descriptionKannada),
    destinationUrl: item.destinationUrl,
    displayOrder: item.displayOrder,
    // FOOTER exists in the DB enum (another developer's in-progress work,
    // not wired to any application code) but never actually appears here -
    // nothing creates one, and the response schema only allows the three
    // placements this app supports.
    placement: item.placement as AdvertisementDto['placement'],
    // FILL is a leftover, unused DB enum value from an earlier design of
    // this same feature (crop used to be gated behind it) - nothing ever
    // writes it any more, so it's narrowed away the same way FOOTER is.
    fitMode: item.fitMode as AdvertisementDto['fitMode'],
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
