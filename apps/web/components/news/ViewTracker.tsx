'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  articleId: string;
  /** Half the article's read time: past this, the visit counts as a read. */
  thresholdSeconds: number;
}

const storageKey = (articleId: string) => `ctn_read_${articleId}`;

function alreadyCounted(articleId: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(articleId)) === '1';
  } catch {
    // Storage can be blocked; counting twice beats never counting.
    return false;
  }
}

function markCounted(articleId: string): void {
  try {
    sessionStorage.setItem(storageKey(articleId), '1');
  } catch {
    // See alreadyCounted.
  }
}

/**
 * Counts one read once the reader has had the article in view for longer
 * than `thresholdSeconds`. A single timer runs only while the tab is visible,
 * so there is no polling, and the one request it ever makes is a beacon
 * carrying just the article id. A browser tab counts an article once.
 */
export function ViewTracker({ articleId, thresholdSeconds }: ViewTrackerProps) {
  useEffect(() => {
    if (alreadyCounted(articleId)) return;

    let remainingMs = thresholdSeconds * 1000 + 1;
    let timer: number | undefined;
    let startedAt = 0;

    const count = () => {
      markCounted(articleId);
      document.removeEventListener('visibilitychange', onVisibility);
      navigator.sendBeacon('/api/article-view', articleId);
    };

    const pause = () => {
      if (timer === undefined) return;
      window.clearTimeout(timer);
      timer = undefined;
      remainingMs -= Date.now() - startedAt;
    };

    const resume = () => {
      if (timer !== undefined) return;
      startedAt = Date.now();
      timer = window.setTimeout(count, remainingMs);
    };

    function onVisibility() {
      if (document.visibilityState === 'visible') resume();
      else pause();
    }

    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    return () => {
      pause();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [articleId, thresholdSeconds]);

  return null;
}
