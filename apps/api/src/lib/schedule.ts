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

/**
 * BreakingNews allows a null endAt: an admin can run an item indefinitely
 * from startAt and take it down by deleting the row instead of scheduling an
 * end. A null endAt is treated as "never ends" here, not "never active" —
 * still no is_active column, still computed at read time.
 */
export interface OpenEndedSchedule {
  startAt: Date;
  endAt: Date | null;
}

export function isActiveAtOpenEnded(
  item: OpenEndedSchedule,
  now: Date = new Date(),
): boolean {
  return (
    item.startAt.getTime() <= now.getTime() &&
    (item.endAt === null || now.getTime() <= item.endAt.getTime())
  );
}

export function withIsActiveOpenEnded<T extends OpenEndedSchedule>(
  item: T,
  now: Date = new Date(),
): T & { isActive: boolean } {
  return { ...item, isActive: isActiveAtOpenEnded(item, now) };
}
