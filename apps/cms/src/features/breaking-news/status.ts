import type { BreakingNewsDto } from '@coastal-talk-news/types';

export type BreakingNewsStatus = 'active' | 'scheduled' | 'expired';

export function breakingNewsStatusValue(
  item: Pick<BreakingNewsDto, 'startAt' | 'endAt'>,
  now: Date = new Date(),
): BreakingNewsStatus {
  const nowMs = now.getTime();
  if (nowMs < new Date(item.startAt).getTime()) return 'scheduled';
  if (item.endAt !== null && nowMs > new Date(item.endAt).getTime()) {
    return 'expired';
  }
  return 'active';
}

const LABELS: Record<BreakingNewsStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
};

const TONES: Record<BreakingNewsStatus, 'green' | 'blue' | 'slate'> = {
  active: 'green',
  scheduled: 'blue',
  expired: 'slate',
};

export function breakingNewsStatus(
  item: BreakingNewsDto,
  now: Date = new Date(),
) {
  const value = breakingNewsStatusValue(item, now);
  return { value, label: LABELS[value], tone: TONES[value] };
}
