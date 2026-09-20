import { useCallback, type KeyboardEvent } from 'react';

/**
 * The W3C tabs pattern: arrow keys move along a tab list, Home and End jump
 * to its ends. Spread onto the element holding `role="tablist"`.
 */
export function useTabListKeys(
  orientation: 'horizontal' | 'vertical' = 'horizontal',
) {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      if (
        ![previousKey, nextKey, 'Home', 'End'].includes(event.key) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const tabs = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
      ).filter((tab) => !tab.hasAttribute('disabled'));
      if (tabs.length === 0) return;

      const current = tabs.findIndex((tab) => tab === document.activeElement);
      const selected = tabs.findIndex(
        (tab) => tab.getAttribute('aria-selected') === 'true',
      );
      const from = current === -1 ? selected : current;

      let target: number;
      if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else if (event.key === nextKey) target = (from + 1) % tabs.length;
      else target = (from - 1 + tabs.length) % tabs.length;

      event.preventDefault();
      tabs[target]?.focus();
      tabs[target]?.click();
    },
    [orientation],
  );

  return { onKeyDown };
}

/** Moves the page's tab list on by `step`, for the global `[` and `]` keys. */
export function stepPageTab(step: number): boolean {
  const tabList = document.querySelector<HTMLElement>('[role="tablist"]');
  if (!tabList) return false;

  const tabs = Array.from(
    tabList.querySelectorAll<HTMLElement>('[role="tab"]'),
  ).filter((tab) => !tab.hasAttribute('disabled'));
  if (tabs.length === 0) return false;

  const selected = tabs.findIndex(
    (tab) => tab.getAttribute('aria-selected') === 'true',
  );
  const from = selected === -1 ? 0 : selected;
  tabs[(from + step + tabs.length) % tabs.length]?.click();
  return true;
}
