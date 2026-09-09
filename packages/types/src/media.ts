import type { Id } from './api.js';

/** Media as embedded in another resource, carrying the URL a client renders. */
export interface MediaSummaryDto {
  id: Id;
  url: string;
  width: number;
  height: number;
}
