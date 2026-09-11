import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';

interface AdColumnProps {
  advertisements: PublicAdvertisementDto[];
  className?: string;
}

/**
 * Unlike the horizontal bands, the column has no width to divide between
 * creatives — each one gets the full rail, stacked, so a tall or square
 * image never gets squeezed down to fit beside another.
 */
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
      <ul className="flex flex-col gap-6">
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
                width={ad.image.width}
                height={ad.image.height}
                sizes="288px"
                className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
