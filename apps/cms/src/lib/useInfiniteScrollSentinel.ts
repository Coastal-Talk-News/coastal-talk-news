import { useEffect, useRef } from 'react';

interface Options {
  enabled?: boolean;
  /** The scrollable ancestor to watch within — omit for the page itself. */
  root?: HTMLElement | null;
}

/**
 * Ref for an element placed at the end of a list; calls `onReachEnd` once it
 * scrolls near view, so the next page loads as the user scrolls rather than
 * needing a "Load more" click. `rootMargin` starts the fetch a little before
 * the sentinel is actually on screen, so scrolling never outpaces it.
 */
export function useInfiniteScrollSentinel(
  onReachEnd: () => void,
  { enabled = true, root = null }: Options = {},
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // A ref, not a dependency: onReachEnd is a fresh closure every render, and
  // re-subscribing the observer for that alone would cost nothing but churn.
  const onReachEndRef = useRef(onReachEnd);
  onReachEndRef.current = onReachEnd;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onReachEndRef.current();
      },
      { root, rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, root]);

  return sentinelRef;
}
