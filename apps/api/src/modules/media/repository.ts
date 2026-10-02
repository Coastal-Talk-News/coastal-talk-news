import type { TransactionClient } from '@coastal-talk-news/db';

export interface ListFilters {
  search?: string;
}

function where(filters: ListFilters) {
  return filters.search
    ? { filename: { contains: filters.search, mode: 'insensitive' as const } }
    : {};
}

export function findMany(
  db: TransactionClient,
  filters: ListFilters,
  page: { skip: number; take: number },
) {
  return db.mediaAsset.findMany({
    where: where(filters),
    orderBy: { createdAt: 'desc' },
    ...page,
  });
}

export function count(db: TransactionClient, filters: ListFilters) {
  return db.mediaAsset.count({ where: where(filters) });
}

export function findById(db: TransactionClient, id: string) {
  return db.mediaAsset.findUnique({ where: { id } });
}

/**
 * Keyed by `storageKey` rather than a plain insert: a retried register call
 * for the same Cloudinary upload (a dropped response, a double click) must
 * land on the same row, not a duplicate.
 */
export function upsertByStorageKey(
  db: TransactionClient,
  data: {
    filename: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    width: number;
    height: number;
  },
) {
  return db.mediaAsset.upsert({
    where: { storageKey: data.storageKey },
    create: data,
    update: {},
  });
}

export function remove(db: TransactionClient, id: string) {
  return db.mediaAsset.deleteMany({ where: { id } });
}

/** Every stored image's size added together, for the storage cap meter and
 *  its enforcement - regardless of which backend actually holds them. */
export async function totalStorageBytes(
  db: TransactionClient,
): Promise<number> {
  const result = await db.mediaAsset.aggregate({ _sum: { fileSize: true } });
  return result._sum.fileSize ?? 0;
}
