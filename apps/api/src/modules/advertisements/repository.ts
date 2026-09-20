import type {
  AdPlacement,
  Prisma,
  TransactionClient,
} from '@coastal-talk-news/db';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

const withMedia = {
  media: mediaSelect,
  detailMedia: mediaSelect,
} as const;

export type AdvertisementRow = Awaited<ReturnType<typeof findById>>;

export function findById(db: TransactionClient, id: string) {
  return db.advertisement.findUnique({ where: { id }, include: withMedia });
}

export function findMany(
  db: TransactionClient,
  page: { skip: number; take: number },
) {
  return db.advertisement.findMany({
    orderBy: [{ placement: 'asc' }, { displayOrder: 'asc' }],
    include: withMedia,
    ...page,
  });
}

export function count(db: TransactionClient) {
  return db.advertisement.count();
}

/**
 * Counts the ads that would share the zone with this booking — the ones whose
 * run overlaps it. A zone's cap is on how many run at once, so an ad that has
 * already finished, or that starts after this one ends, never occupies a slot;
 * counting every row instead would make a one-slot zone impossible to re-book.
 */
export function countOverlappingInPlacement(
  db: TransactionClient,
  placement: AdPlacement,
  window: { startAt: Date; endAt: Date },
  excludeId?: string,
) {
  return db.advertisement.count({
    where: {
      placement,
      startAt: { lte: window.endAt },
      endAt: { gte: window.startAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

/** How many ads currently sit in this zone, regardless of schedule. */
export function countInPlacement(
  db: TransactionClient,
  placement: AdPlacement,
) {
  return db.advertisement.count({ where: { placement } });
}

/**
 * The position to give a new ad in this zone, or one that just moved into it:
 * one past whichever position is currently highest, so it lands at the end
 * without disturbing anything already there.
 */
export async function nextDisplayOrder(
  db: TransactionClient,
  placement: AdPlacement,
): Promise<number> {
  const last = await db.advertisement.findFirst({
    where: { placement },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  return last ? last.displayOrder + 1 : 0;
}

/** ids that exist and belong to this placement — the reorder call's inputs
 * are checked against this, not a bare existence check, since an id from the
 * wrong zone must fail the same way one that doesn't exist at all does. */
export function findIdsInPlacement(
  db: TransactionClient,
  placement: AdPlacement,
  ids: string[],
) {
  return db.advertisement.findMany({
    where: { id: { in: ids }, placement },
    select: { id: true },
  });
}

export function setDisplayOrder(
  db: TransactionClient,
  id: string,
  displayOrder: number,
) {
  return db.advertisement.update({
    where: { id },
    data: { displayOrder },
    select: { id: true },
  });
}

export interface AdvertisementWriteData {
  advertiserName: string;
  mediaId: string;
  detailMediaId: string | null;
  /** Prisma.DbNull clears the column; a plain null would be rejected. */
  description: object | typeof Prisma.DbNull;
  descriptionText: string | null;
  destinationUrl: string | null;
  displayOrder: number;
  placement: AdPlacement;
  zoom: number;
  offsetX: number;
  offsetY: number;
  startAt: Date;
  endAt: Date;
}

export function create(db: TransactionClient, data: AdvertisementWriteData) {
  return db.advertisement.create({ data, include: withMedia });
}

export function update(
  db: TransactionClient,
  id: string,
  data: Partial<AdvertisementWriteData>,
) {
  return db.advertisement.update({
    where: { id },
    data,
    include: withMedia,
  });
}

export function remove(db: TransactionClient, id: string) {
  return db.advertisement.delete({ where: { id }, select: { id: true } });
}

export function mediaExists(db: TransactionClient, mediaId: string) {
  return db.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
}
