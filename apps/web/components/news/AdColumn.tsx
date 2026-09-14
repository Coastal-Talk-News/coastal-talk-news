import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adAspectRatio, galleryRows, rowMaxWidth } from '../../lib/ads';
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
  maxHeight?: number;
}

/**
 * A narrow rail can only pair creatives of similar shape before one of them is
 * squeezed to a sliver, so it is stricter than the full-width block.
 */
const SHAPE = {
  // No height cap in the rail: every row fills the column, so the creatives
  // share one left and right edge however tall each one turns out.
  rail: { maxPerRow: 2, ratioBudget: 3.2, maxShapeSpread: 1.6 },
  // The block is wide enough that an unconstrained row would be enormous, so
  // rows there are capped and centred instead.
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
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <ul
            key={row.key}
            className={`mx-auto flex w-full gap-4 ${
              // A phone is too narrow to put two creatives side by side; the
              // rail never gets that wide, so this is the block's problem only.
              variant === 'block' ? 'flex-col sm:flex-row' : ''
            }`}
            style={
              shape.maxHeight
                ? { maxWidth: rowMaxWidth(row, shape.maxHeight, GAP) }
                : undefined
            }
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
                <a
                  href={ad.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  aria-label={`${advertisement}: ${ad.advertiserName}`}
                  className="border-rule group block overflow-hidden rounded-card border transition-shadow hover:shadow-lg"
                >
                  <Image
                    src={ad.image.url}
                    alt={ad.advertiserName}
                    width={ad.image.width}
                    height={ad.image.height}
                    sizes={
                      variant === 'rail'
                        ? '288px'
                        : '(min-width: 640px) 640px, 100vw'
                    }
                    className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}
