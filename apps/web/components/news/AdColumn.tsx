import Image from 'next/image';
import Link from 'next/link';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adHref, splitColumns } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface AdColumnProps {
  advertisements: PublicAdvertisementDto[];
  /** `rail` is the narrow sidebar; `block` runs full width under the article. */
  variant?: 'rail' | 'block';
  className?: string;
  locale?: Locale;
}

/**
 * Every ad in a zone is sold at the same price, so every one of them gets the
 * same width - a fixed column, not a size that depends on its own shape or on
 * whichever creative it happens to land beside. Height is never capped or
 * cropped: each creative keeps its own proportions at that fixed width,
 * however tall that turns out to be, so the complete ad always shows. The one
 * thing held equal, deliberately, is width.
 *
 * The two columns each stack their own ads independently (see splitColumns) -
 * not a shared grid row per pair, which would stretch a short ad's row to
 * match a tall neighbour and leave a gap underneath it.
 */
const COLUMN_COUNT = 2;

const SIZES = {
  rail: '(min-width: 1120px) 174px, 118px',
  // block only ever renders below the 800px breakpoint that switches the
  // layout to the rail, so it is always close to half that viewport.
  block: '50vw',
};

export function AdColumn({
  advertisements,
  variant = 'rail',
  className = '',
  locale = 'en',
}: AdColumnProps) {
  if (advertisements.length === 0) return null;

  const { advertisement } = getDictionary(locale).common;
  const columns = splitColumns(advertisements, COLUMN_COUNT);

  return (
    <aside aria-label={advertisement} className={className}>
      <div className="grid grid-cols-2 gap-3">
        {columns.map((column, columnIndex) => (
          <ul key={columnIndex} className="flex flex-col gap-3">
            {column.map((ad) => (
              <li key={ad.id}>
                <Link
                  href={adHref(ad.id)}
                  rel="sponsored"
                  // A rail of ads would otherwise prefetch a page each as it
                  // scrolls into view, for a click most readers never make.
                  prefetch={false}
                  aria-label={`${advertisement}: ${ad.advertiserName}`}
                  className="border-rule group rounded-card block overflow-hidden border transition-shadow hover:shadow-lg"
                >
                  <Image
                    src={ad.image.url}
                    alt={ad.advertiserName}
                    width={ad.image.width}
                    height={ad.image.height}
                    sizes={SIZES[variant]}
                    className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}
