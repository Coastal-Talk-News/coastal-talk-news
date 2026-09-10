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

export function create(
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
  return db.mediaAsset.create({ data });
}

export function remove(db: TransactionClient, id: string) {
  return db.mediaAsset.deleteMany({ where: { id } });
}
