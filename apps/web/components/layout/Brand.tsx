import Image from 'next/image';
import Link from 'next/link';

interface BrandProps {
  siteName: string;
  tagline: string | null;
  tone?: 'default' | 'inverse';
  priority?: boolean;
}

export function Brand({
  siteName,
  tagline,
  tone = 'default',
  priority = false,
}: BrandProps) {
  const nameColor = tone === 'inverse' ? 'text-white' : 'text-ink';
  const taglineColor =
    tone === 'inverse' ? 'text-night-muted' : 'text-ink-subtle';

  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <Image
        src="/logo.jpeg"
        alt=""
        width={96}
        height={96}
        priority={priority}
        className="size-10 shrink-0 rounded-sm object-cover"
      />
      <span className="leading-none">
        <span
          className={`${nameColor} block font-serif text-xl font-bold sm:text-2xl`}
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
