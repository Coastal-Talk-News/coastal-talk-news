import Image from 'next/image';
import Link from 'next/link';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adHref } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface AdBandProps {
  advertisements: PublicAdvertisementDto[];
  className?: string;
  locale?: Locale;
}

// Fixed ad-unit size for the top band — every creative renders at exactly
// this size regardless of what it was uploaded at, so the row never reflows
// as ads change.
const WIDTH = 320.57;
const HEIGHT = 73.88;
// next/image requires an integer for the fetched-resource size; the fractional
// values above still govern the actual on-screen box via the inline style.
const FETCH_WIDTH = Math.round(WIDTH);
const FETCH_HEIGHT = Math.round(HEIGHT);

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
      className={`mx-auto w-full max-w-6xl px-4 ${className}`}
    >
      <div className="border-rule border-y py-4">
        <ul className="flex flex-wrap items-center justify-center gap-4">
          {advertisements.map((ad) => (
            <li key={ad.id}>
              <Link
                href={adHref(ad.id)}
                rel="sponsored"
                // A band of ads would otherwise prefetch a page each as it
                // scrolls into view, for a click most readers never make.
                prefetch={false}
                aria-label={`${advertisement}: ${ad.advertiserName}`}
                className="block overflow-hidden rounded-sm transition-opacity hover:opacity-90"
              >
                <Image
                  src={ad.image.url}
                  alt={ad.advertiserName}
                  width={FETCH_WIDTH}
                  height={FETCH_HEIGHT}
                  sizes={`${FETCH_WIDTH}px`}
                  className="object-cover"
                  style={{ width: WIDTH, height: HEIGHT }}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
