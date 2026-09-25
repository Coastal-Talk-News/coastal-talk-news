'use client';

import { useEffect } from 'react';

/**
 * Stops F12 and Ctrl+Shift+I from opening the browser's developer tools on
 * the live site. A deterrent, not protection, in the same spirit as the
 * drag-select and image-drag blocks in globals.css: the tools can still be
 * opened from the browser menu, and the page source stays public.
 *
 * Live site only. Anywhere else the newsroom's developers need those
 * shortcuts to work on the site itself.
 */
export function DevToolsShortcutGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const onKeyDown = (event: KeyboardEvent) => {
      const isF12 = event.key === 'F12';
      const isCtrlShiftI =
        event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i';
      if (isF12 || isCtrlShiftI) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Capture phase, so nothing on the page can get in first.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return null;
}
