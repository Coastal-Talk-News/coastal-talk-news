'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';

interface CategoryNavProps {
  categories: PublicNavCategoryDto[];
  homeLabel: string;
  moreLabel: string;
  moreAriaLabel: string;
  sectionsLabel: string;
}

const ITEM_CLASS =
  'block border-b-2 px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors';
const IDLE = 'border-transparent hover:text-brand';
const ACTIVE = 'border-brand text-brand';

/**
 * Shows as many sections as fit and puts the rest under "More"; a fixed count
 * cannot work, since what fits depends on the viewport and on name lengths.
 * Widths come from an off-screen copy of the full list — measuring the visible
 * row returns zero for anything already hidden, so the count could shrink but
 * never grow back.
 */
export function CategoryNav({
  categories,
  homeLabel,
  moreLabel,
  moreAriaLabel,
  sectionsLabel,
}: CategoryNavProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [visibleCount, setVisibleCount] = useState(categories.length);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const recompute = () => {
      const [home, ...rest] = Array.from(measure.children) as HTMLElement[];
      const more = rest.pop();
      if (!home || !more) return;

      const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
      const available = row.clientWidth;
      const widths = rest.map((item) => item.offsetWidth);
      const total = widths.reduce((sum, w) => sum + w + gap, home.offsetWidth);

      if (total <= available) {
        setVisibleCount(categories.length);
        return;
      }

      let used = home.offsetWidth + gap + more.offsetWidth;
      let fits = 0;
      for (const width of widths) {
        if (used + gap + width > available) break;
        used += gap + width;
        fits += 1;
      }
      setVisibleCount(fits);
    };

    const observer = new ResizeObserver(recompute);
    observer.observe(row);
    observer.observe(measure);
    recompute();
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);

  const categoryHref = (id: string) => `/category/${id}`;
  const isHome = pathname === '/';
  const activeCategoryId = categories.find(
    (category) => pathname === categoryHref(category.id),
  )?.id;
  // Otherwise nothing is marked while reading an overflowed section.
  const activeIsHidden = overflow.some(
    (category) => category.id === activeCategoryId,
  );

  return (
    <nav ref={navRef} aria-label={sectionsLabel} className="relative">
      <div ref={rowRef} className="flex items-center gap-1 overflow-hidden">
        <Link
          href="/"
          aria-current={isHome ? 'page' : undefined}
          className={`${ITEM_CLASS} ${isHome ? ACTIVE : IDLE}`}
        >
          {homeLabel}
        </Link>
        {visible.map((category) => {
          const active = category.id === activeCategoryId;
          return (
            <Link
              key={category.id}
              href={categoryHref(category.id)}
              aria-current={active ? 'page' : undefined}
              className={`${ITEM_CLASS} ${active ? ACTIVE : IDLE}`}
            >
              {category.name}
            </Link>
          );
        })}

        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={moreAriaLabel}
            className={`${ITEM_CLASS} ${activeIsHidden ? ACTIVE : IDLE} flex items-center gap-1`}
          >
            {moreLabel}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Outside the row: nested inside, its clipping would hide this. */}
      {open && overflow.length > 0 && (
        <ul className="border-rule bg-paper absolute top-full right-0 z-40 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-sm border py-1 shadow-lg">
          {overflow.map((category) => (
            <li key={category.id}>
              <Link
                href={categoryHref(category.id)}
                aria-current={
                  category.id === activeCategoryId ? 'page' : undefined
                }
                className={`hover:bg-paper-sunken block px-4 py-2 text-sm font-semibold transition-colors ${
                  category.id === activeCategoryId
                    ? 'bg-brand-soft text-brand'
                    : 'hover:text-brand'
                }`}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* The wrapper clips so this full-width copy cannot extend the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-0 w-full overflow-hidden"
      >
        <div
          ref={measureRef}
          className="invisible flex w-max items-center gap-1"
        >
          <span className={`${ITEM_CLASS} ${IDLE}`}>{homeLabel}</span>
          {categories.map((category) => (
            <span key={category.id} className={`${ITEM_CLASS} ${IDLE}`}>
              {category.name}
            </span>
          ))}
          <span
            className={`${ITEM_CLASS} ${IDLE} inline-flex items-center gap-1`}
          >
            {moreLabel}
            <span className="size-3.5" />
          </span>
        </div>
      </div>
    </nav>
  );
}
