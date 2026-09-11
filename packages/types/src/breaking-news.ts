import type { Id, IsoDateTime } from './api.js';

export interface BreakingNewsDto {
  id: Id;
  headline: string;
  articleUrl: string;
  startAt: IsoDateTime;
  endAt: IsoDateTime | null;
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CreateBreakingNewsRequest {
  headline: string;
  articleUrl?: string;
  startAt: IsoDateTime;
  endAt?: IsoDateTime | null;
}

export type UpdateBreakingNewsRequest = Partial<CreateBreakingNewsRequest>;
