'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../../lib/i18n/types';
import { SearchField } from './SearchField';

/**
 * Sits at the end of the category row: an icon by default so it doesn't
 * compete with CategoryNav's own width measurement, expanding into the
 * unmodified SearchField (same submit behavior) only once clicked.
 */
export function HeaderSearchToggle({
  locale,
  searchLabel,
}: {
  locale: Locale;
  searchLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (open) {
    return (
      <div ref={containerRef} className="w-56 shrink-0 py-1.5">
        <SearchField locale={locale} autoFocus />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={searchLabel}
        className="text-ink-muted hover:text-brand flex size-9 items-center justify-center transition-colors"
      >
        <svg aria-hidden viewBox="0 0 20 20" fill="none" className="size-4.5">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="m13.5 13.5 3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
