import type { Id, IsoDateTime } from './api.js';

export interface BreakingNewsDto {
  id: Id;
  headline: string;
  /** Empty string means the ticker item carries no outbound link. */
  articleUrl: string;
  startAt: IsoDateTime;
  /** Null means the item runs indefinitely from startAt until deleted. */
  endAt: IsoDateTime | null;
  /** Computed from startAt/endAt on every read — never stored (CLAUDE.md §13). */
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CreateBreakingNewsRequest {
  headline: string;
  articleUrl?: string;
  startAt: IsoDateTime;
  /** Omit or null for an item with no scheduled end. */
  endAt?: IsoDateTime | null;
}

export type UpdateBreakingNewsRequest = Partial<CreateBreakingNewsRequest>;
