import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';

interface AdBandProps {
  advertisements: PublicAdvertisementDto[];
  className?: string;
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

export function AdBand({ advertisements, className = '' }: AdBandProps) {
  if (advertisements.length === 0) return null;

  return (
    <aside
      aria-label="Advertisement"
      className={`mx-auto w-full max-w-6xl px-4 ${className}`}
    >
      <div className="border-rule border-y py-5">
        <p className="text-ink-subtle mb-3 text-center text-[9px] tracking-[0.2em] uppercase">
          Advertisement
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-4">
          {advertisements.map((ad) => (
            <li key={ad.id}>
              <a
                href={ad.destinationUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={`Advertisement: ${ad.advertiserName}`}
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
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
