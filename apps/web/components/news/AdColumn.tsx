import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';

interface AdColumnProps {
  advertisements: PublicAdvertisementDto[];
  className?: string;
}

// Fixed ad-unit size for the sidebar — every creative renders at exactly
// this size regardless of what it was uploaded at, so the rail never
// reflows as ads change.
const WIDTH = 250;
const HEIGHT = 300;

export function AdColumn({ advertisements, className = '' }: AdColumnProps) {
  if (advertisements.length === 0) return null;

  return (
    <aside
      // xl is deliberate, not lg: this same component also renders as a
      // full-width block below the article on narrower screens (see
      // layout.tsx), and sticky only makes sense once it's an actual sidebar.
      aria-label="Advertisement"
      className={`xl:sticky xl:top-6 xl:self-start ${className}`}
    >
      <p className="text-ink-subtle mb-4 text-center text-[10px] font-semibold tracking-[0.2em] uppercase">
        Advertisement
      </p>
      <ul className="flex flex-col items-center gap-6">
        {advertisements.map((ad) => (
          <li key={ad.id}>
            <a
              href={ad.destinationUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={`Advertisement: ${ad.advertiserName}`}
              className="border-rule bg-paper-sunken group block overflow-hidden rounded-card border transition-shadow hover:shadow-lg"
            >
              <Image
                src={ad.image.url}
                alt={ad.advertiserName}
                width={WIDTH}
                height={HEIGHT}
                sizes={`${WIDTH}px`}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                style={{ width: WIDTH, height: HEIGHT }}
              />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
