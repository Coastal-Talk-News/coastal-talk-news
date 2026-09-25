import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GO_TO_TARGETS } from './registry.js';
import { stepPageTab } from './useTabListKeys.js';

/** How long `g` waits for the second key before giving up. */
const SEQUENCE_TIMEOUT_MS = 1200;

/**
 * Typing an `n` into a headline must not navigate away, so anything that
 * takes text — including the Tiptap editor, which is a contenteditable —
 * swallows the single-key shortcuts.
 */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Pages that keep every tab mounted (Settings) carry one button per tab, all
 * but one of them hidden, and an open panel sits after the page in the DOM. So
 * the target is the last one actually on screen - the first match would be a
 * hidden tab's button, and Ctrl+S would quietly do nothing.
 */
function clickPageAction(action: 'create' | 'search' | 'save'): boolean {
  const element = [
    ...document.querySelectorAll<HTMLElement>(`[data-shortcut="${action}"]`),
  ]
    .filter((candidate) => candidate.getClientRects().length > 0)
    .at(-1);
  if (!element) return false;
  if (action === 'search') element.focus();
  else element.click();
  return true;
}

export function useGlobalShortcuts({
  onShowShortcuts,
  onToggleSidebar,
}: {
  onShowShortcuts: () => void;
  onToggleSidebar: () => void;
}) {
  const navigate = useNavigate();
  const awaitingGoTo = useRef(false);
  const goToTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearSequence() {
      awaitingGoTo.current = false;
      if (goToTimer.current) clearTimeout(goToTimer.current);
      goToTimer.current = null;
    }

    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (key === 'b' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onToggleSidebar();
        return;
      }

      // Ctrl+S is a modified key, so it stays live while typing — an author
      // reaching for it mid-sentence expects a save, and the browser's own
      // "save page" dialog is never what they wanted.
      if (key === 's' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        if (clickPageAction('save')) event.preventDefault();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;

      if (awaitingGoTo.current) {
        const target = GO_TO_TARGETS.find((item) => item.key === key);
        clearSequence();
        if (target) {
          event.preventDefault();
          navigate(target.to);
        }
        return;
      }

      if (key === 'g') {
        awaitingGoTo.current = true;
        goToTimer.current = setTimeout(clearSequence, SEQUENCE_TIMEOUT_MS);
        return;
      }

      // `?` is Shift+/ on most layouts, so match the character rather than
      // the physical key.
      if (event.key === '?') {
        event.preventDefault();
        onShowShortcuts();
        return;
      }

      if (event.key === '/') {
        if (clickPageAction('search')) event.preventDefault();
        return;
      }

      if (event.key === '[' || event.key === ']') {
        if (stepPageTab(event.key === ']' ? 1 : -1)) event.preventDefault();
        return;
      }

      if (key === 'c' && !event.shiftKey) {
        if (clickPageAction('create')) event.preventDefault();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearSequence();
    };
  }, [navigate, onShowShortcuts, onToggleSidebar]);
}
