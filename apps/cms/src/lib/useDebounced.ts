import { useEffect, useState } from 'react';

/** Long enough to cover the gap between keystrokes of a steady typist. */
export const SEARCH_DEBOUNCE_MS = 400;

export function useDebounced<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
