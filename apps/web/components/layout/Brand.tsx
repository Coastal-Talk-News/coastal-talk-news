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

/**
 * The masthead is the largest type on the site, and one step of a single
 * scale: headline 1.9x body, standfirst 1.1x body, the name matching the
 * headline exactly so no heading ever outgrows the paper's own title.
 * Change these and change the headline sizes with them (the article page's
 * h1, HeroStory) and the body and standfirst in globals.css.
 */
/**
 * The name is set from the width it actually has rather than from
 * breakpoints, so it fills the lockup on one line at any screen size and
 * still gets out of the way of the masthead ad when that sits beside it.
 * 8.8cqw is what the site name measures per unit of container width; the cap
 * sits just under the headline's (.headline-xl in globals.css).
 */
const NAME_SIZE = {
  md: 'min(2rem, 8.8cqw)',
  lg: 'min(2.25rem, 8.8cqw)',
};

/**
 * The header keeps the lockup to a fixed height, so the tagline is held to a
 * line there. The footer has the column to itself and simply wraps: a
 * newspaper's own strapline should never end in an ellipsis.
 */
const TAGLINE_CLAMP = {
  md: '',
  lg: 'line-clamp-2 sm:line-clamp-1',
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
      {/* flex-1, not content-sized: the name is sized from this box, so the
          box must be measured from the row's spare space rather than from the
          name inside it. */}
      <span className="@container min-w-0 flex-1 leading-none">
        {/* One line at every width: a masthead that wraps or is cut off
            mid-word reads as broken. */}
        <span
          className={`${nameColor} block font-serif leading-tight font-bold whitespace-nowrap uppercase`}
          style={{ fontSize: NAME_SIZE[size] }}
        >
          {siteName}
        </span>
        {tagline && (
          // Two lines on a phone rather than moving out of the lockup.
          <span
            className={`${taglineColor} ${TAGLINE_CLAMP[size]} mt-1 font-serif text-[11px] font-semibold`}
          >
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
