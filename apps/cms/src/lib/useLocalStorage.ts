import { useCallback, useState } from 'react';

/** Persisted state that degrades to in-memory when storage is unavailable. */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? fallback : (JSON.parse(stored) as T);
    } catch {
      return fallback;
    }
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // A failed write only costs persistence, not the current session.
      }
    },
    [key],
  );

  return [value, update] as const;
}
