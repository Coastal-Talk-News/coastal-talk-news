'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { PublicBreakingNewsDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

/** Reading pace, in pixels per second. */
const SPEED_PX_PER_SECOND = 55;

export function BreakingTicker({
  items,
  locale = 'en',
}: {
  items: PublicBreakingNewsDto[];
  locale?: Locale;
}) {
  const windowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLUListElement>(null);
  const [copyWidth, setCopyWidth] = useState(0);
  const [copies, setCopies] = useState(2);

  useLayoutEffect(() => {
    const viewport = windowRef.current;
    const copy = copyRef.current;
    if (!viewport || !copy) return;

    const measure = () => {
      const width = copy.getBoundingClientRect().width;
      if (width === 0) return;
      setCopyWidth(width);
      // The loop restarts the moment one copy has passed, so the track has to
      // stay a full copy wider than the window — otherwise the tail runs out
      // mid-window and the list appears to jump back before it has finished.
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / width) + 1));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(copy);
    measure();
    return () => observer.disconnect();
  }, [items, locale]);

  if (items.length === 0) return null;

  const label = getDictionary(locale).breakingNews.label;
  // Measured rather than estimated from character counts: a Kannada headline
  // and an English one of the same length are nowhere near the same width.
  const duration = copyWidth > 0 ? copyWidth / SPEED_PX_PER_SECOND : 0;

  return (
    <section aria-label={label} className="bg-brand text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="text-brand shrink-0 rounded-sm bg-white px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase">
          {label}
        </span>

        <div ref={windowRef} className="group min-w-0 flex-1 overflow-hidden">
          <div
            style={
              {
                '--marquee-shift': `${copyWidth}px`,
                animationDuration: `${duration}s`,
              } as CSSProperties
            }
            className={`flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] ${
              duration > 0 ? 'animate-marquee' : ''
            }`}
          >
            {Array.from({ length: copies }, (_, copyIndex) => (
              <ul
                key={copyIndex}
                ref={copyIndex === 0 ? copyRef : undefined}
                // Only the first copy is content; the rest fill the window and
                // would otherwise be announced several times over.
                aria-hidden={copyIndex > 0}
                className="flex shrink-0 text-sm font-semibold"
              >
                {items.map((item) => (
                  <li key={item.id} className="shrink-0 pe-10">
                    {item.articleUrl ? (
                      <Link
                        href={item.articleUrl}
                        tabIndex={copyIndex > 0 ? -1 : 0}
                        className="whitespace-nowrap transition-opacity hover:opacity-80"
                      >
                        {item.headline}
                      </Link>
                    ) : (
                      <span className="whitespace-nowrap">{item.headline}</span>
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
