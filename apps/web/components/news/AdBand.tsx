import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  visibleAdBox,
  type PublicAdvertisementDto,
} from '@coastal-talk-news/types';
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
const SLOT = { width: 408, height: 88 };
/**
 * A fixed height or a share of the screen, whichever is smaller — several of
 * these stacked on a phone must still leave the news in view. Capped by
 * width rather than height, since capping the height would change the
 * shape. Only applies while the slots stack: side by side, a full row shares
 * the whole width, so the cap would only leave wide gaps between them.
 */
const SLOT_MAX_WIDTH = 'calc(min(5.5rem, 12vh) * 408 / 88)';
/** Below a full row a slot stays this wide and the row centres, rather than
 * one or two ads stretching across the page. */
const SLOT_WIDTH = '340px';
/** The same two height caps above, expressed as plain heights rather than a
 *  408x88 width, so a FIT_SHRINK ad - whose box follows its own image's
 *  shape, not the fixed slot's - can be capped exactly as consistently. */
const SLOT_MAX_HEIGHT = 'min(5.5rem, 12vh)';
const SLOT_STACK_HEIGHT = `${(340 * SLOT.height) / SLOT.width}px`;

/**
 * Every other fit mode draws the fixed 408x88 box; FIT_SHRINK is the one
 * exception - its box takes the shape of whatever is actually visible at
 * the ad's own zoom (the same math the CMS preview uses), so the slot is
 * only ever as big as the creative actually fills, with nothing left over.
 * Zooming far enough closes the gap on its own, same as every other mode.
 */
function slotBox(ad: PublicAdvertisementDto): {
  width: number;
  height: number;
} {
  return ad.fitMode === 'FIT_SHRINK'
    ? visibleAdBox(ad.image, SLOT, ad.zoom)
    : SLOT;
}

function slotStyle(box: { width: number; height: number }): CSSProperties {
  const aspect = box.width / box.height;
  return {
    '--slot-max': `min(calc(${SLOT_STACK_HEIGHT} * ${aspect}), calc(${SLOT_MAX_HEIGHT} * ${aspect}))`,
    '--slot-basis': `${SLOT.height * aspect}px`,
  } as CSSProperties;
}

export function AdBand({
  advertisements,
  className = '',
  locale = 'en',
}: AdBandProps) {
  if (advertisements.length === 0) return null;
  const { advertisement } = getDictionary(locale).common;

  return (
    <aside
      aria-label={advertisement}
      className={`mx-auto w-full max-w-7xl px-4 ${className}`}
    >
      <div className="border-rule border-y py-3">
        {/* One rule handles every count, from 1 up to however many the zone
            allows: each slot wants its own designed width (sm:basis-408px)
            but never grows past it (sm:grow-0) and is free to shrink evenly
            below it (sm:shrink) if the row has more ads than fit. Few ads
            settle at their natural width and the row centres with open space
            either side; enough ads to fill the row shrink together, evenly,
            edge to edge - never wrapping, never leaving one ad stranded on
            its own line below a fuller row above it. Below sm they stack
            instead, each at its own capped width. Where the artwork sits
            inside a slot - filling it, or showing the whole creative with
            room around it - is entirely the CMS's call per ad, not this
            component's; this only ever sizes and spaces the slots
            themselves, never what is shown inside one. */}
        <ul className="flex flex-wrap items-stretch justify-center gap-3 sm:flex-nowrap">
          {advertisements.map((ad) => {
            const box = slotBox(ad);
            return (
              <li
                key={ad.id}
                className={`w-full max-w-(--slot-max) sm:w-auto sm:max-w-none sm:min-w-0 sm:shrink sm:grow-0 sm:basis-(--slot-basis) ${
                  // Every other mode shares the row's fixed height, so the
                  // default stretch is a no-op for them; FIT_SHRINK's box
                  // follows its own image's shape instead, and must not be
                  // stretched to match its neighbours' height.
                  ad.fitMode === 'FIT_SHRINK' ? 'sm:self-start' : ''
                }`}
                style={slotStyle(box)}
              >
                <Link
                  href={adHref(ad.id)}
                  rel="sponsored"
                  // A band of ads would otherwise prefetch a page each as it
                  // scrolls into view, for a click most readers never make.
                  prefetch={false}
                  aria-label={`${advertisement}: ${ad.advertiserName}`}
                  className="block w-full overflow-hidden rounded-sm transition-opacity hover:opacity-90"
                  style={{ aspectRatio: `${box.width} / ${box.height}` }}
                >
                  <AdImage
                    image={ad.image}
                    alt={ad.advertiserName}
                    label={advertisement}
                    sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 90vw"
                    className="h-full w-full object-contain"
                    style={adImageTransform(ad)}
                    backdrop={ad.fitMode === 'FIT_BACKGROUND'}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
