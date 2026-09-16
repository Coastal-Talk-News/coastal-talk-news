import Image from 'next/image';
import Link from 'next/link';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adAspectRatio, adHref, galleryRows, rowMaxWidth } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface AdColumnProps {
  advertisements: PublicAdvertisementDto[];
  /** `rail` is the narrow sidebar; `block` runs full width under the article. */
  variant?: 'rail' | 'block';
  className?: string;
  locale?: Locale;
}

const GAP = 16;

interface GalleryShape {
  maxPerRow: number;
  ratioBudget: number;
  maxShapeSpread: number;
  maxHeight: number;
}

/**
 * A photo-gallery pack: creatives keep their own proportions and share a row
 * when their shapes suit each other, so nothing is cropped or letterboxed.
 *
 * Both numbers exist to keep the rows a similar height, which is what stops
 * one advertiser dwarfing another. The budget sets the height a full-width row
 * lands on (rail width / budget), and the cap catches the other end: a lone
 * tall creative with no partner would otherwise stretch the full width of the
 * rail and tower over everything below it - measured at 474px against a
 * neighbour's 116px before the cap existed.
 */
const SHAPE = {
  rail: {
    maxPerRow: 2,
    ratioBudget: 1.6,
    maxShapeSpread: 1.6,
    maxHeight: 260,
  },
  block: {
    maxPerRow: 4,
    ratioBudget: 9,
    maxShapeSpread: 2.2,
    maxHeight: 240,
  },
} as const satisfies Record<string, GalleryShape>;

export function AdColumn({
  advertisements,
  variant = 'rail',
  className = '',
  locale = 'en',
}: AdColumnProps) {
  if (advertisements.length === 0) return null;

  const { advertisement } = getDictionary(locale).common;
  const shape: GalleryShape = SHAPE[variant];
  const rows = galleryRows(advertisements, shape);

  return (
    <aside aria-label={advertisement} className={className}>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <ul
            key={row.key}
            className={`mx-auto flex w-full gap-4 ${
              // A phone is too narrow to put two creatives side by side; the
              // rail never gets that wide, so this is the block's problem only.
              variant === 'block' ? 'flex-col sm:flex-row' : ''
            }`}
            // Capping the row's width is what caps its height, since the two
            // move together once the creatives' proportions are fixed.
            style={{ maxWidth: rowMaxWidth(row, shape.maxHeight, GAP) }}
          >
            {row.ads.map((ad) => (
              // Growing by each creative's own ratio lands every image in the
              // row on one height, at its true proportions and uncropped.
              <li
                key={ad.id}
                className="min-w-0"
                // Normalised so a row's grow factors sum to 1: with a sum
                // below 1, flexbox hands out only that fraction of the free
                // space and leaves the rest of the row empty.
                style={{
                  flexGrow: adAspectRatio(ad.image) / row.ratioSum,
                  flexBasis: 0,
                }}
              >
                <Link
                  href={adHref(ad.id)}
                  rel="sponsored"
                  prefetch={false}
                  aria-label={`${advertisement}: ${ad.advertiserName}`}
                  className="border-rule group rounded-card block overflow-hidden border transition-shadow hover:shadow-lg"
                >
                  <Image
                    src={ad.image.url}
                    alt={ad.advertiserName}
                    width={ad.image.width}
                    height={ad.image.height}
                    sizes={
                      variant === 'rail'
                        ? '(min-width: 1100px) 320px, (min-width: 1024px) 340px, 240px'
                        : '(min-width: 640px) 640px, 100vw'
                    }
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
