import type { ReactNode } from 'react';
import type { PublicSiteSettingsDto } from '@coastal-talk-news/types';

type Platform = 'facebook' | 'instagram' | 'youtube' | 'x';

// Hand-drawn rather than pulled from an icon library — four glyphs don't
// justify a new dependency, and every other icon in this app (search,
// hamburger, hero placeholder) is already inline SVG.
const ICON_PATHS: Record<Platform, ReactNode> = {
  facebook: (
    <path d="M13.5 21v-7.2h2.4l.36-2.8h-2.76V9.1c0-.81.22-1.36 1.39-1.36h1.48V5.2a19.8 19.8 0 0 0-2.16-.11c-2.14 0-3.6 1.31-3.6 3.71v2.2H8.1v2.8h2.51V21h2.89Z" />
  ),
  instagram: (
    <>
      <rect
        x="4.2"
        y="4.2"
        width="15.6"
        height="15.6"
        rx="4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="16.4" cy="7.6" r="0.9" />
    </>
  ),
  youtube: (
    <>
      <rect
        x="3.2"
        y="6"
        width="17.6"
        height="12"
        rx="3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M10.4 9.7v4.6l4.2-2.3-4.2-2.3Z" />
    </>
  ),
  x: (
    <path
      d="m5.5 5.5 13 13M18.5 5.5l-13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
};

const LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  x: 'X',
};

interface SocialLinksProps {
  settings: Pick<
    PublicSiteSettingsDto,
    'facebookUrl' | 'instagramUrl' | 'youtubeUrl' | 'xUrl'
  >;
  tone?: 'default' | 'inverse';
  className?: string;
}

/** Shared by the header and footer so the two never drift out of sync. */
export function SocialLinks({
  settings,
  tone = 'default',
  className = '',
}: SocialLinksProps) {
  const links = (
    [
      { platform: 'facebook', href: settings.facebookUrl },
      { platform: 'instagram', href: settings.instagramUrl },
      { platform: 'youtube', href: settings.youtubeUrl },
      { platform: 'x', href: settings.xUrl },
    ] satisfies Array<{ platform: Platform; href: string | null }>
  ).filter(
    (link): link is { platform: Platform; href: string } =>
      link.href !== null && link.href !== '',
  );

  if (links.length === 0) return null;

  const buttonTone =
    tone === 'inverse'
      ? 'bg-white/10 text-white hover:bg-white hover:text-night'
      : 'bg-paper-sunken text-ink-muted hover:bg-brand hover:text-white';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LABELS[link.platform]}
          title={LABELS[link.platform]}
          className={`${buttonTone} grid size-7 shrink-0 place-items-center rounded-full transition-colors`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            className="size-3.5"
          >
            {ICON_PATHS[link.platform]}
          </svg>
        </a>
      ))}
    </div>
  );
}
