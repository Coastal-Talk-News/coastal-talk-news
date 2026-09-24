import type { Id, IsoDateTime } from './api.js';

export interface BreakingNewsDto {
  id: Id;
  headline: string;
  /** Required on every new or edited item. Null only on items saved before
   * it was required — the reader site falls back to `headline` for those. */
  headlineKannada: string | null;
  articleUrl: string;
  startAt: IsoDateTime;
  endAt: IsoDateTime | null;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CreateBreakingNewsRequest {
  headline: string;
  headlineKannada: string;
  articleUrl?: string;
  startAt: IsoDateTime;
  endAt?: IsoDateTime | null;
}

export type UpdateBreakingNewsRequest = Partial<CreateBreakingNewsRequest>;
