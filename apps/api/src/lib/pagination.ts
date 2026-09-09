import type { PaginationMeta } from '@coastal-talk-news/types';

export interface PaginationParams {
  page: number;
  limit: number;
}

export function toSkipTake({ page, limit }: PaginationParams): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

export function buildPaginationMeta(
  { page, limit }: PaginationParams,
  total: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
}

export function listEnvelope<T>(
  items: T[],
  params: PaginationParams,
  total: number,
): { success: true; data: T[]; meta: PaginationMeta } {
  return {
    success: true,
    data: items,
    meta: buildPaginationMeta(params, total),
  };
}

export function dataEnvelope<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}
