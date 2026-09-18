import type { ReactNode } from 'react';
import type { PublicSiteSettingsDto } from '@coastal-talk-news/types';
import type { Locale } from '../../lib/i18n/types';

type Platform = 'facebook' | 'instagram' | 'youtube' | 'x' | 'whatsapp';

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
  // The official X wordmark, not a plain cross — a generic "×" reads as a
  // close/dismiss icon rather than the brand.
  x: (
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  ),
  // The real WhatsApp mark — a chat-bubble outline plus its phone-receiver
  // squiggle, both filled (not the plain stroked approximation this used to
  // be), so it actually reads as WhatsApp rather than a generic chat icon.
  whatsapp: (
    <>
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.98.577 3.827 1.578 5.383L2 22l4.735-1.554A9.955 9.955 0 0 0 12.001 22C17.523 22 22 17.522 22 12S17.523 2 12.001 2Zm0 18.174a8.122 8.122 0 0 1-4.132-1.13l-.297-.176-3.06.999 1.004-2.98-.194-.307a8.144 8.144 0 0 1-1.267-4.38c0-4.51 3.674-8.183 8.187-8.183 2.188 0 4.243.851 5.786 2.396a8.133 8.133 0 0 1 2.393 5.79c0 4.51-3.673 8.183-8.42 7.971Z" />
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
    </>
  ),
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
