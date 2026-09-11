export const API_BASE_PATH = '/api/v1';

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
