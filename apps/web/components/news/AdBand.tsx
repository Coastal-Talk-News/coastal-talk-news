import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adAspectRatio, galleryRows, rowMaxWidth } from '../../lib/ads';

type Variant = 'leaderboard' | 'banner';

interface AdBandProps {
  advertisements: PublicAdvertisementDto[];
  variant?: Variant;
  className?: string;
}

const GAP = 16;

/**
 * On a phone a band's creatives stack full width, so showing the whole slice
 * would put several screens of advertising above the first headline. Only the
 * lead creative runs there; the rest are still reachable in the roster that
 * follows the news.
 */
const MOBILE_LIMIT = 1;

const SHAPE: Record<Variant, { maxHeight: number; ratioBudget: number }> = {
  leaderboard: { maxHeight: 200, ratioBudget: 10 },
  banner: { maxHeight: 150, ratioBudget: 12 },
};

export function AdBand({
  advertisements,
  variant = 'leaderboard',
  className = '',
}: AdBandProps) {
  if (advertisements.length === 0) return null;

  const { maxHeight, ratioBudget } = SHAPE[variant];
  const rows = galleryRows(advertisements, { maxPerRow: 4, ratioBudget });

  let placed = 0;
  const rowOffsets = rows.map((row) => {
    const offset = placed;
    placed += row.ads.length;
    return offset;
  });

  return (
    <aside
      aria-label="Advertisement"
      className={`mx-auto w-full max-w-6xl px-4 ${className}`}
    >
      <div className="border-rule border-y py-5">
        <p className="text-ink-subtle mb-3 text-center text-[9px] tracking-[0.2em] uppercase">
          Advertisement
        </p>
        <div className="flex flex-col gap-4">
          {rows.map((row, rowIndex) => (
            <ul
              key={row.key}
              className={`mx-auto flex w-full flex-col gap-4 sm:flex-row ${
                (rowOffsets[rowIndex] ?? 0) >= MOBILE_LIMIT
                  ? 'hidden sm:flex'
                  : ''
              }`}
              style={{ maxWidth: rowMaxWidth(row, maxHeight, GAP) }}
            >
              {row.ads.map((ad, adIndex) => (
                // Growing by the creative's own ratio makes every image in the
                // row land on the same height without any of them being resized.
                <li
                  key={ad.id}
                  className={`min-w-0 ${
                    (rowOffsets[rowIndex] ?? 0) + adIndex >= MOBILE_LIMIT
                      ? 'hidden sm:block'
                      : ''
                  }`}
                  style={{ flexGrow: adAspectRatio(ad.image), flexBasis: 0 }}
                >
                  <a
                    href={ad.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    aria-label={`Advertisement: ${ad.advertiserName}`}
                    className="block transition-opacity hover:opacity-90"
                  >
                    {/* Stacked on a phone, a square or portrait creative at
                        full width would be taller than the headline it sits
                        above, so there it scales to fit a height budget
                        instead. From sm up the row layout governs again. */}
                    <Image
                      src={ad.image.url}
                      alt={ad.advertiserName}
                      width={ad.image.width}
                      height={ad.image.height}
                      sizes="(min-width: 640px) 720px, 100vw"
                      className="mx-auto block h-auto w-auto max-h-56 max-w-full rounded-sm sm:max-h-none sm:w-full"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </aside>
  );
}
