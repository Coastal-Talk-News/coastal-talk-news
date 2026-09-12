import type { AdPlacement, TransactionClient } from '@coastal-talk-news/db';

const withMedia = {
  media: {
    select: { id: true, storageKey: true, width: true, height: true },
  },
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
    orderBy: [{ priority: 'desc' }, { startAt: 'desc' }],
    include: withMedia,
    ...page,
  });
}

export function count(db: TransactionClient) {
  return db.advertisement.count();
}

export function countByPlacement(
  db: TransactionClient,
  placement: AdPlacement,
  excludeId?: string,
) {
  return db.advertisement.count({
    where: { placement, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
}

export interface AdvertisementWriteData {
  advertiserName: string;
  mediaId: string;
  destinationUrl: string;
  priority: number;
  placement: AdPlacement;
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
