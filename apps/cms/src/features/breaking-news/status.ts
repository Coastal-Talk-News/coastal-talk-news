import type { BreakingNewsDto } from '@coastal-talk-news/types';

export type BreakingNewsStatus = 'active' | 'scheduled' | 'expired';

/**
 * Derived from startAt/endAt only — never from the DTO's isActive field.
 * isActive is a snapshot from whenever the item was last fetched, so an item
 * sitting at a boundary wouldn't flip in the CMS until something refetched
 * the list. Recomputing from the raw timestamps against a live `now` (see
 * BreakingNewsPage's ticking clock) lets the status change on screen without
 * a page refresh, while still deriving everything at read time rather than
 * storing it (CLAUDE.md §13).
 */
export function breakingNewsStatusValue(
  item: Pick<BreakingNewsDto, 'startAt' | 'endAt'>,
  now: Date = new Date(),
): BreakingNewsStatus {
  const nowMs = now.getTime();
  if (nowMs < new Date(item.startAt).getTime()) return 'scheduled';
  // A null endAt means the admin left it open-ended — it runs until deleted,
  // so it can never age into "expired" on its own.
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
