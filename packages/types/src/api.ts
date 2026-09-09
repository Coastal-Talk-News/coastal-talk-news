/**
 * The API response contract. Every endpoint returns one of these three shapes.
 * Matching TypeBox schemas live in @coastal-talk-news/validation.
 */

export const API_BASE_PATH = '/api/v1';

/** ISO 8601, e.g. "2026-09-08T04:37:46.169Z". */
export type IsoDateTime = string;

export type Id = string;

export interface ApiSuccess<TData> {
  success: true;
  data: TData;
}

export interface ApiListSuccess<TItem> {
  success: true;
  data: TItem[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  /** Across all pages, not the length of `data`. */
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
