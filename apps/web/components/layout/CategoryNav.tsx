'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PublicNavCategoryDto } from '@coastal-talk-news/types';

interface CategoryNavProps {
  categories: PublicNavCategoryDto[];
  homeLabel: string;
  moreLabel: string;
  moreAriaLabel: string;
  sectionsLabel: string;
}

const ITEM_CLASS =
  'block border-b-2 px-2 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors';
const IDLE = 'border-transparent hover:text-brand';
const ACTIVE = 'border-brand text-brand';

function ChevronIcon({ open }: { open: boolean }) {
  return (
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
  );
}

/**
 * Shows as many sections as fit and puts the rest under "More"; a fixed count
 * cannot work, since what fits depends on the viewport and on name lengths.
 * Widths come from an off-screen copy of the full list — measuring the visible
 * row returns zero for anything already hidden, so the count could shrink but
 * never grow back.
 *
 * `categories` is the site's full flat list (parents and children alike, so
 * the homepage grid and mobile drawer can keep reading it as-is) — this nav
 * renders only the top-level entries in the row/overflow, each with its own
 * `children` shown in a click-to-open dropdown.
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
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  // Memoized so its reference is stable across renders that don't change
  // `categories` — otherwise the resize-observer effect below (keyed on this
  // value) would resubscribe on every render, including the one caused by
  // opening a dropdown, and its observer's own initial-size callback would
  // immediately close the dropdown it had just opened.
  const topLevel = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories],
  );
  const [visibleCount, setVisibleCount] = useState(topLevel.length);
  const [open, setOpen] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const pathname = usePathname();

  // The row itself clips (`overflow-hidden`, for the "More" measurement
  // below) — a dropdown nested inside it would be clipped too, so it's
  // rendered as a sibling instead, positioned against a measured offset.
  useLayoutEffect(() => {
    if (!openCategoryId || !navRef.current) return;
    const trigger = triggerRefs.current.get(openCategoryId);
    if (!trigger) return;
    const navRect = navRef.current.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    setDropdownLeft(triggerRect.left - navRect.left);
  }, [openCategoryId]);

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
        setVisibleCount(topLevel.length);
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

    const observer = new ResizeObserver(() => {
      recompute();
      // Anchors and the visible/overflow split are both stale after a resize.
      setOpen(false);
      setOpenCategoryId(null);
    });
    observer.observe(row);
    observer.observe(measure);
    recompute();
    return () => observer.disconnect();
  }, [topLevel]);

  useEffect(() => {
    setOpen(false);
    setOpenCategoryId(null);
  }, [pathname]);

  useEffect(() => {
    if (!open && !openCategoryId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setOpenCategoryId(null);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setOpenCategoryId(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, openCategoryId]);

  const visible = topLevel.slice(0, visibleCount);
  const overflow = topLevel.slice(visibleCount);

  const categoryHref = (id: string) => `/category/${id}`;
  const isHome = pathname === '/';
  const activeCategoryId = categories.find(
    (category) => pathname === categoryHref(category.id),
  )?.id;
  const isActiveGroup = (category: PublicNavCategoryDto) =>
    category.id === activeCategoryId ||
    category.children.some((child) => child.id === activeCategoryId);
  // Otherwise nothing is marked while reading an overflowed section.
  const activeIsHidden = overflow.some(isActiveGroup);

  return (
    <nav ref={navRef} aria-label={sectionsLabel} className="relative">
      <div ref={rowRef} className="flex items-center gap-0.5 overflow-hidden">
        <Link
          href="/"
          aria-current={isHome ? 'page' : undefined}
          className={`${ITEM_CLASS} ${isHome ? ACTIVE : IDLE}`}
        >
          {homeLabel}
        </Link>
        {visible.map((category) => {
          const active = isActiveGroup(category);
          const hasChildren = category.children.length > 0;

          if (!hasChildren) {
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
          }

          const dropdownOpen = openCategoryId === category.id;
          return (
            <button
              key={category.id}
              ref={(el) => {
                if (el) triggerRefs.current.set(category.id, el);
                else triggerRefs.current.delete(category.id);
              }}
              type="button"
              onClick={() =>
                setOpenCategoryId((current) =>
                  current === category.id ? null : category.id,
                )
              }
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              className={`${ITEM_CLASS} ${active ? ACTIVE : IDLE} flex items-center gap-1`}
            >
              {category.name}
              <ChevronIcon open={dropdownOpen} />
            </button>
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
            <ChevronIcon open={open} />
          </button>
        )}
      </div>

      {/* Outside the row: nested inside, its clipping would hide this. */}
      {openCategoryId &&
        (() => {
          const category = visible.find((c) => c.id === openCategoryId);
          if (!category) return null;
          return (
            <ul
              style={{ left: dropdownLeft }}
              className="border-rule bg-paper grain absolute top-full z-40 mt-1 w-52 overflow-hidden rounded-sm border py-1 shadow-lg"
            >
              {category.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={categoryHref(child.id)}
                    aria-current={
                      child.id === activeCategoryId ? 'page' : undefined
                    }
                    className={`hover:bg-paper-sunken block px-4 py-2 text-sm font-semibold transition-colors ${
                      child.id === activeCategoryId
                        ? 'bg-brand-soft text-brand'
                        : 'hover:text-brand'
                    }`}
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          );
        })()}

      {/* Outside the row: nested inside, its clipping would hide this. */}
      {open && overflow.length > 0 && (
        <ul className="border-rule bg-paper grain absolute top-full right-0 z-40 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-sm border py-1 shadow-lg">
          {overflow.map((category) => {
            const active = isActiveGroup(category);
            return (
              <li key={category.id}>
                <Link
                  href={categoryHref(category.id)}
                  aria-current={
                    category.id === activeCategoryId ? 'page' : undefined
                  }
                  className={`hover:bg-paper-sunken block px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? 'bg-brand-soft text-brand' : 'hover:text-brand'
                  }`}
                >
                  {category.name}
                </Link>
                {category.children.length > 0 && (
                  <ul className="pb-1">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={categoryHref(child.id)}
                          aria-current={
                            child.id === activeCategoryId ? 'page' : undefined
                          }
                          className={`hover:bg-paper-sunken block py-1.5 pr-4 pl-7 text-sm font-medium transition-colors ${
                            child.id === activeCategoryId
                              ? 'bg-brand-soft text-brand'
                              : 'text-ink-muted hover:text-brand'
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* The wrapper clips so this full-width copy cannot extend the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-0 w-full overflow-hidden"
      >
        <div
          ref={measureRef}
          className="invisible flex w-max items-center gap-0.5"
        >
          <span className={`${ITEM_CLASS} ${IDLE}`}>{homeLabel}</span>
          {topLevel.map((category) => (
            <span
              key={category.id}
              className={`${ITEM_CLASS} ${IDLE} inline-flex items-center gap-1`}
            >
              {category.name}
              {category.children.length > 0 && <span className="size-3.5" />}
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
