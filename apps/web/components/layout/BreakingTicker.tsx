import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { PublicBreakingNewsDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

// Tuned for the ~14px bold ticker text: an average glyph is roughly this wide,
// and each item also carries the gap-10 (2.5rem) spacing that follows it.
const AVERAGE_CHAR_PX = 8;
const ITEM_GAP_PX = 40;
const PIXELS_PER_SECOND = 55;
// A one- or two-item ticker would otherwise finish its loop in a couple of
// seconds — too fast to read — so the pace never drops below this floor.
const MIN_DURATION_S = 14;

function estimateDurationSeconds(items: PublicBreakingNewsDto[]): number {
  const widthPx = items.reduce(
    (sum, item) => sum + item.headline.length * AVERAGE_CHAR_PX + ITEM_GAP_PX,
    0,
  );
  return Math.max(widthPx / PIXELS_PER_SECOND, MIN_DURATION_S);
}

export function BreakingTicker({
  items,
  locale = 'en',
}: {
  items: PublicBreakingNewsDto[];
  locale?: Locale;
}) {
  if (items.length === 0) return null;

  // The track is the list duplicated once: the CSS animation slides it by
  // exactly one copy's width, so the moment the first copy scrolls fully
  // offscreen the second is sitting in the exact position it started in —
  // a continuous loop with no jump or reset, independent of how much
  // content there is or how wide the viewport is.
  const track = [...items, ...items];
  const durationSeconds = estimateDurationSeconds(items);
  const label = getDictionary(locale).breakingNews.label;

  return (
    <section aria-label={label} className="bg-brand text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="text-brand shrink-0 rounded-sm bg-white px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase">
          {label}
        </span>
        <div className="group min-w-0 flex-1 overflow-hidden">
          <ul
            style={
              { animationDuration: `${durationSeconds}s` } as CSSProperties
            }
            className="animate-marquee flex w-max items-center gap-10 text-sm font-semibold group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          >
            {track.map((item, index) => {
              // The second copy of the list exists only to keep the loop
              // seamless — it must stay invisible to screen readers and
              // out of tab order, or every headline gets announced twice.
              const isDuplicate = index >= items.length;
              return (
                <li
                  key={`${item.id}-${index}`}
                  aria-hidden={isDuplicate}
                  className="shrink-0"
                >
                  {item.articleUrl ? (
                    <Link
                      href={item.articleUrl}
                      tabIndex={isDuplicate ? -1 : 0}
                      className="whitespace-nowrap transition-opacity hover:opacity-80"
                    >
                      {item.headline}
                    </Link>
                  ) : (
                    <span className="whitespace-nowrap">{item.headline}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
