import type { BreakingNewsDto } from '@coastal-talk-news/types';
import { withIsActiveOpenEnded } from '../../lib/schedule.js';

export interface BreakingNewsEntity {
  id: string;
  headline: string;
  articleUrl: string;
  startAt: Date;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toBreakingNewsDto(
  item: BreakingNewsEntity,
  now: Date = new Date(),
): BreakingNewsDto {
  const { isActive } = withIsActiveOpenEnded(item, now);
  return {
    id: item.id,
    headline: item.headline,
    articleUrl: item.articleUrl,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt ? item.endAt.toISOString() : null,
    isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
