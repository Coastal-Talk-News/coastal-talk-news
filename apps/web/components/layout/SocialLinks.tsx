import type { ReactNode } from 'react';
import type { PublicSiteSettingsDto } from '@coastal-talk-news/types';
import type { Locale } from '../../lib/i18n/types';

type Platform = 'facebook' | 'instagram' | 'youtube' | 'x' | 'whatsapp';

/** Glyphs shared with the article share row, so both read as one icon set. */
export const FACEBOOK_ICON_PATH =
  'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z';

export const X_ICON_PATH =
  'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.49-8.56L1 2.25h6.83l4.84 6.4 5.57-6.4Zm-1.16 17.52h1.83L6.01 4.13H4.05l13.03 15.64Z';

export const WHATSAPP_ICON_PATH =
  'M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.03 2.59c.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.14-1.19-.06-.1-.22-.17-.46-.29Z';

// Hand-drawn rather than pulled from an icon library — four glyphs don't
// justify a new dependency, and every other icon in this app (search,
// hamburger, hero placeholder) is already inline SVG.
const ICON_PATHS: Record<Platform, ReactNode> = {
  facebook: <path d={FACEBOOK_ICON_PATH} />,
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
  // The official X wordmark, not a plain cross — a generic "×" reads as a
  // close/dismiss icon rather than the brand.
  x: <path d={X_ICON_PATH} />,
  whatsapp: <path d={WHATSAPP_ICON_PATH} />,
};

const LABELS: Record<Platform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  x: 'X',
  whatsapp: 'WhatsApp',
};

interface SocialLinksProps {
  settings: Pick<
    PublicSiteSettingsDto,
    | 'facebookUrl'
    | 'instagramUrl'
    | 'youtubeUrl'
    | 'xUrl'
    | 'whatsappEnglishUrl'
    | 'whatsappKannadaUrl'
  >;
  /** Picks which of the two WhatsApp channels to show — see the field's own doc-comment. */
  locale: Locale;
  tone?: 'default' | 'inverse';
  className?: string;
}

/** Shared by the header and footer so the two never drift out of sync. */
export function SocialLinks({
  settings,
  locale,
  tone = 'default',
  className = '',
}: SocialLinksProps) {
  const whatsappUrl =
    locale === 'en' ? settings.whatsappEnglishUrl : settings.whatsappKannadaUrl;

  const links = (
    [
      { platform: 'facebook', href: settings.facebookUrl },
      { platform: 'instagram', href: settings.instagramUrl },
      { platform: 'youtube', href: settings.youtubeUrl },
      { platform: 'x', href: settings.xUrl },
      { platform: 'whatsapp', href: whatsappUrl },
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
