import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adAspectRatio, galleryRows, rowMaxWidth } from '../../lib/ads';

interface AdColumnProps {
  advertisements: PublicAdvertisementDto[];
  className?: string;
}

const GAP = 12;
const MAX_HEIGHT = 220;

export function AdColumn({ advertisements, className = '' }: AdColumnProps) {
  if (advertisements.length === 0) return null;

  const rows = galleryRows(advertisements, { maxPerRow: 2, ratioBudget: 3.2 });

  return (
    <aside aria-label="Advertisement" className={className}>
      <p className="text-ink-subtle border-rule mb-3 border-b pb-1.5 text-center text-[9px] tracking-[0.2em] uppercase">
        Advertisement
      </p>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <ul
            key={row.key}
            className="mx-auto flex w-full gap-3"
            style={{ maxWidth: rowMaxWidth(row, MAX_HEIGHT, GAP) }}
          >
            {row.ads.map((ad) => (
              // Growing by the creative's own ratio makes every image in the
              // row land on the same height without any of them being resized.
              <li
                key={ad.id}
                className="min-w-0"
                style={{ flexGrow: adAspectRatio(ad.image), flexBasis: 0 }}
              >
                <a
                  href={ad.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  aria-label={`Advertisement: ${ad.advertiserName}`}
                  className="block transition-opacity hover:opacity-90"
                >
                  <Image
                    src={ad.image.url}
                    alt={ad.advertiserName}
                    width={ad.image.width}
                    height={ad.image.height}
                    sizes="288px"
                    className="h-auto w-full rounded-sm"
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
