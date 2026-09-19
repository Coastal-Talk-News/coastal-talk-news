import Image from 'next/image';
import Link from 'next/link';
import type { MediaSummaryDto } from '@coastal-talk-news/types';

interface BrandProps {
  siteName: string;
  tagline: string | null;
  logo?: MediaSummaryDto | null;
  tone?: 'default' | 'inverse';
  priority?: boolean;
  size?: 'md' | 'lg';
}

/** Sized to share a phone row with the menu button without wrapping. */
const LOGO_SIZE = {
  md: 'size-9 sm:size-10',
  lg: 'size-9 sm:size-12 lg:size-[52px]',
};

const GAP = {
  md: 'gap-2 sm:gap-2.5',
  lg: 'gap-2 sm:gap-3.5',
};

const NAME_SIZE = {
  md: 'text-base sm:text-lg md:text-xl',
  lg: 'text-base sm:text-xl lg:text-[26px]',
};

export function Brand({
  siteName,
  tagline,
  logo = null,
  tone = 'default',
  priority = false,
  size = 'md',
}: BrandProps) {
  const nameColor = tone === 'inverse' ? 'text-white' : 'text-ink';
  const taglineColor =
    tone === 'inverse' ? 'text-night-muted' : 'text-ink-subtle';
  const ringColor = tone === 'inverse' ? 'ring-white/15' : 'ring-rule';

  return (
    <Link href="/" className={`flex min-w-0 items-center ${GAP[size]}`}>
      {/* Nothing is drawn without a logo: an empty frame reads as broken. */}
      {logo && (
        <Image
          src={logo.url}
          alt=""
          width={logo.width}
          height={logo.height}
          priority={priority}
          className={`${LOGO_SIZE[size]} ring-1 ${ringColor} shrink-0 rounded-full object-cover shadow-sm`}
        />
      )}
      <span className="min-w-0 leading-none">
        {/* One phrase: truncate rather than break the name across lines. */}
        <span
          className={`${nameColor} ${NAME_SIZE[size]} block truncate font-brand-name`}
        >
          {siteName}
        </span>
        {tagline && (
          // Two lines on a phone rather than moving out of the lockup.
          <span
            className={`${taglineColor} font-brand-tagline mt-1 line-clamp-2 text-[11px] sm:line-clamp-1`}
          >
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
