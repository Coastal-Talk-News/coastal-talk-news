import Image from 'next/image';
import Link from 'next/link';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adHref } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface MastheadAdProps {
  advertisements: PublicAdvertisementDto[];
  /** `inline` sits beside the site name; `band` is the row under it. */
  variant: 'inline' | 'band';
  locale?: Locale;
}

/**
 * The premium slot, sold one notch larger than the Top unit's 320.57x73.88 in
 * both dimensions. Both numbers are caps: the creative keeps its own
 * proportions inside them and is never cropped, whatever resolution the
 * advertiser sends.
 */
const UNIT_WIDTH = 400;
const UNIT_HEIGHT = 92;

export function MastheadAd({
  advertisements,
  variant,
  locale = 'en',
}: MastheadAdProps) {
  const [ad] = advertisements;
  if (!ad) return null;

  const { advertisement } = getDictionary(locale).common;
  const isInline = variant === 'inline';

  // The cap goes on the link, which has a width to measure against, rather
  // than on the image, whose own width is what is being constrained. Below
  // that width the slot simply scales down with the screen.
  const ratio = ad.image.width / ad.image.height;
  const maxWidth = Math.min(
    UNIT_WIDTH,
    UNIT_HEIGHT * ratio,
    // Never drawn larger than the file supplied, so a small creative in a
    // wide slot stays sharp instead of blurring.
    ad.image.width,
  );

  return (
    <aside
      aria-label={advertisement}
      className={
        isInline
          ? 'hidden min-w-0 flex-1 justify-center lg:flex'
          : 'border-rule flex justify-center border-t px-4 py-2 lg:hidden'
      }
    >
      <Link
        href={adHref(ad.id)}
        rel="sponsored"
        prefetch={false}
        aria-label={`${advertisement}: ${ad.advertiserName}`}
        className="block w-full min-w-0 transition-opacity hover:opacity-90"
        style={{ maxWidth }}
      >
        <Image
          src={ad.image.url}
          alt={ad.advertiserName}
          width={ad.image.width}
          height={ad.image.height}
          priority
          sizes={`${UNIT_WIDTH}px`}
          className="h-auto w-full"
        />
      </Link>
    </aside>
  );
}
