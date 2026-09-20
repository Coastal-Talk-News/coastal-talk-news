import Link from 'next/link';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adHref, adImageTransform } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { AdImage } from './AdImage';

interface AdBandProps {
  advertisements: PublicAdvertisementDto[];
  className?: string;
  locale?: Locale;
}

/**
 * The slot's shape, and the one thing here that never moves: it is what the
 * advertiser bought and what the CMS frames the creative against, so a crop
 * set there has to hold at every width. Only the slot's size follows the
 * viewport. Mirrored by PLACEMENT_META in the CMS.
 */
const SLOT_ASPECT = '408 / 88';
/**
 * A fixed height or a share of the screen, whichever is smaller — three of
 * these stacked on a phone must still leave the news in view. Capped by width
 * rather than height, since capping the height would change the shape.
 */
const SLOT_MAX_WIDTH = 'calc(min(5.5rem, 12vh) * 408 / 88)';
/** Below a full row a slot stays this wide and the row centres, rather than
 * one or two ads stretching across the page. */
const SLOT_WIDTH = '340px';
const FULL_ROW = 3;

export function AdBand({
  advertisements,
  className = '',
  locale = 'en',
}: AdBandProps) {
  if (advertisements.length === 0) return null;
  const { advertisement } = getDictionary(locale).common;
  const fillsRow = advertisements.length >= FULL_ROW;

  return (
    <aside
      aria-label={advertisement}
      className={`mx-auto w-full max-w-7xl px-4 ${className}`}
    >
      <div className="border-rule border-y py-3">
        {/* From sm up a full row divides the page between its slots; below
            that they stack, and one or two ads centre at their own width
            instead of being stretched across the page. Where the artwork
            sits inside a slot is the CMS's call per ad, not this
            component's. */}
        <ul className="flex flex-wrap items-stretch justify-center gap-3">
          {advertisements.map((ad) => (
            <li
              key={ad.id}
              className={fillsRow ? 'w-full sm:min-w-0 sm:flex-1' : 'w-full'}
              style={{
                maxWidth: fillsRow
                  ? SLOT_MAX_WIDTH
                  : `min(${SLOT_WIDTH}, ${SLOT_MAX_WIDTH})`,
              }}
            >
              <Link
                href={adHref(ad.id)}
                rel="sponsored"
                // A band of ads would otherwise prefetch a page each as it
                // scrolls into view, for a click most readers never make.
                prefetch={false}
                aria-label={`${advertisement}: ${ad.advertiserName}`}
                className="block w-full overflow-hidden rounded-sm transition-opacity hover:opacity-90"
                style={{ aspectRatio: SLOT_ASPECT }}
              >
                <AdImage
                  image={ad.image}
                  alt={ad.advertiserName}
                  label={advertisement}
                  sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 90vw"
                  className="h-full w-full object-contain"
                  style={adImageTransform(ad)}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
