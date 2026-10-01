import { useState } from 'react';

const PREFIX = 'ctn_page_size';
const MIN = 1;
const MAX = 100;

function readStored(key: string, fallback: number): number {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}:${key}`);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isInteger(parsed) && parsed >= MIN && parsed <= MAX
      ? parsed
      : fallback;
  } catch {
    // Storage can be blocked (private mode, a permissions policy); the
    // default is a fine fallback for the rest of this visit.
    return fallback;
  }
}

/**
 * How many rows a paginated table shows. Remembered only for this browser
 * tab (sessionStorage, not localStorage) — coming back later starts over at
 * `defaultLimit` — and scoped to `key`, so one table's choice never leaks
 * into another's.
 */
export function usePageSize(
  key: string,
  defaultLimit: number,
): [number, (next: number) => void] {
  const [limit, setLimitState] = useState(() => readStored(key, defaultLimit));

  function setLimit(next: number) {
    setLimitState(next);
    try {
      sessionStorage.setItem(`${PREFIX}:${key}`, String(next));
    } catch {
      // See readStored: the in-memory value above still works this visit.
    }
  }

  return [limit, setLimit];
}
