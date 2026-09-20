import Link from 'next/link';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adHref, adImageTransform } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { AdImage } from './AdImage';

interface MastheadAdProps {
  advertisements: PublicAdvertisementDto[];
  /** `inline` sits beside the site name; `band` is the row under it. */
  variant: 'inline' | 'band';
  locale?: Locale;
}

/**
 * The premium slot's shape, fixed at every width like the Top band's: the CMS
 * frames the creative against it, so the same crop has to hold beside the
 * site name and in the row under it alike. Mirrored by PLACEMENT_META in the
 * CMS.
 */
const UNIT_ASPECT = '520 / 96';

/**
 * Held against the right edge and roughly as wide as the utility row above
 * it, so it runs back to about where "About Us" sits. The cap is a fixed
 * height or a share of the screen, whichever is smaller, applied as a width
 * so that capping it never changes the shape. Never more than 40% of the row
 * either: the slot keeps its place beside the site name down to the width
 * where the nav collapses, and the masthead needs the rest to stay on one
 * line at its full size.
 */
const UNIT_WIDTH = 520;
const UNIT_MAX_WIDTH = 'min(calc(min(6rem, 20vh) * 520 / 96), 40%)';

/**
 * Below md the nav collapses into the menu button and the site name has the
 * masthead row to itself, so the ad moves to its own row under the header and
 * takes the full width of it. The only limit is the height one every zone
 * has, expressed as a width so it can't change the slot's shape — it bites
 * on a short window, not on an ordinary phone or tablet.
 */
const BAND_MAX_WIDTH = 'calc(18vh * 520 / 96)';

export function MastheadAd({
  advertisements,
  variant,
  locale = 'en',
}: MastheadAdProps) {
  const [ad] = advertisements;
  if (!ad) return null;

  const { advertisement } = getDictionary(locale).common;
  const isInline = variant === 'inline';

  return (
    <aside
      aria-label={advertisement}
      className={
        isInline
          ? 'hidden shrink-0 justify-end md:flex'
          : 'border-rule flex justify-center border-t px-4 py-2 md:hidden'
      }
      style={
        isInline ? { width: UNIT_WIDTH, maxWidth: UNIT_MAX_WIDTH } : undefined
      }
    >
      <Link
        href={adHref(ad.id)}
        rel="sponsored"
        prefetch={false}
        aria-label={`${advertisement}: ${ad.advertiserName}`}
        className="block w-full min-w-0 overflow-hidden rounded-sm transition-opacity hover:opacity-90"
        style={{
          aspectRatio: UNIT_ASPECT,
          ...(isInline ? {} : { maxWidth: BAND_MAX_WIDTH }),
        }}
      >
        <AdImage
          image={ad.image}
          alt={ad.advertiserName}
          label={advertisement}
          priority
          sizes={isInline ? `${UNIT_WIDTH}px` : '100vw'}
          className="h-full w-full object-contain"
          style={adImageTransform(ad)}
        />
      </Link>
    </aside>
  );
}
