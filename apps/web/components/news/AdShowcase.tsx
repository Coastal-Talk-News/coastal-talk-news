import Image from 'next/image';
import type { PublicAdvertisementDto } from '@coastal-talk-news/types';
import { adAspectRatio, galleryRows, rowMaxWidth } from '../../lib/ads';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface AdShowcaseProps {
  advertisements: PublicAdvertisementDto[];
  locale?: Locale;
}

const GAP = 24;

// Creatives are the subject of this page rather than a sidebar to the news, so
// the rows are allowed to run taller than a band's.
const MAX_HEIGHT = 300;

export function AdShowcase({ advertisements, locale = 'en' }: AdShowcaseProps) {
  const rows = galleryRows(advertisements, { maxPerRow: 3, ratioBudget: 7 });
  const dictionary = getDictionary(locale);

  return (
    <div className="flex flex-col gap-10">
      {rows.map((row) => (
        <ul
          key={row.key}
          className="mx-auto flex w-full flex-col gap-6 sm:flex-row"
          style={{ maxWidth: rowMaxWidth(row, MAX_HEIGHT, GAP) }}
        >
          {row.ads.map((ad) => (
            <li
              key={ad.id}
              className="min-w-0"
              style={{ flexGrow: adAspectRatio(ad.image), flexBasis: 0 }}
            >
              <a
                href={ad.destinationUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={`${dictionary.common.advertisement}: ${ad.advertiserName}`}
                className="group block"
              >
                <Image
                  src={ad.image.url}
                  alt={ad.advertiserName}
                  width={ad.image.width}
                  height={ad.image.height}
                  sizes="(min-width: 640px) 720px, 100vw"
                  className="h-auto w-full rounded-sm transition-opacity group-hover:opacity-90"
                />
                <span className="mt-3 flex items-baseline justify-center gap-2">
                  <span className="group-hover:text-brand font-semibold transition-colors">
                    {ad.advertiserName}
                  </span>
                  <span className="text-ink-subtle text-xs">
                    {dictionary.advertise.visitSite} →
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
