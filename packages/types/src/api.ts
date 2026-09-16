export const API_BASE_PATH = '/api/v1';

export type IsoDateTime = string;

export type Id = string;

/**
 * A Tiptap document, as authored in the CMS. Rendered node by node on the
 * reader site — never as HTML — so it stays untrusted input end to end.
 */
export interface RichTextContent {
  type: 'doc';
  content: unknown[];
}

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
