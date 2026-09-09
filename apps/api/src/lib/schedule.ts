/**
 * BreakingNews and Advertisement store no is_active column — the schedule is
 * the only source of truth (CLAUDE.md §13). Public endpoints must filter with
 * activeWindowWhere in SQL, never hide expired rows client-side.
 */

export interface Scheduled {
  startAt: Date;
  endAt: Date;
}

export function isActiveAt(item: Scheduled, now: Date = new Date()): boolean {
  return (
    item.startAt.getTime() <= now.getTime() &&
    now.getTime() <= item.endAt.getTime()
  );
}

export function activeWindowWhere(now: Date = new Date()) {
  return {
    startAt: { lte: now },
    endAt: { gte: now },
  };
}

export function withIsActive<T extends Scheduled>(
  item: T,
  now: Date = new Date(),
): T & { isActive: boolean } {
  return { ...item, isActive: isActiveAt(item, now) };
}
