import Image from 'next/image';
import Link from 'next/link';

interface BrandProps {
  siteName: string;
  tagline: string | null;
  tone?: 'default' | 'inverse';
  priority?: boolean;
  /** `lg` is the header's masthead treatment; `md` (default) fits the footer's tighter column. */
  size?: 'md' | 'lg';
}

const LOGO_SIZE = {
  md: 'size-10',
  lg: 'size-14 sm:size-[68px]',
};

const GAP = {
  md: 'gap-2.5',
  lg: 'gap-3.5',
};

const NAME_SIZE = {
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-[28px]',
};

export function Brand({
  siteName,
  tagline,
  tone = 'default',
  priority = false,
  size = 'md',
}: BrandProps) {
  const nameColor = tone === 'inverse' ? 'text-white' : 'text-ink';
  const taglineColor =
    tone === 'inverse' ? 'text-night-muted' : 'text-ink-subtle';
  const ringColor = tone === 'inverse' ? 'ring-white/15' : 'ring-rule';

  return (
    <Link href="/" className={`flex shrink-0 items-center ${GAP[size]}`}>
      {/* The artwork is a round emblem, so it's framed as a circle rather than
          the plain rounded-square crop used elsewhere in this app. */}
      <Image
        src="/logo.jpeg"
        alt=""
        width={136}
        height={136}
        priority={priority}
        className={`${LOGO_SIZE[size]} ring-1 ${ringColor} shrink-0 rounded-full object-cover shadow-sm`}
      />
      <span className="leading-none">
        <span
          className={`${nameColor} ${NAME_SIZE[size]} block font-serif font-bold`}
        >
          {siteName}
          <span className="text-brand">.</span>
        </span>
        {tagline && (
          <span className={`${taglineColor} mt-1 hidden text-[11px] sm:block`}>
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
