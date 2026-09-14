import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { CopyLinkButton } from './CopyLinkButton';

interface ShareLinksProps {
  url: string;
  headline: string;
  locale?: Locale;
  /** `compact` is the icon row beside the dateline; `panel` ends the story. */
  variant?: 'compact' | 'panel';
}

const ICON = 'size-4';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border transition-colors';
const IDLE = 'border-rule text-ink-muted';
const SIZE = {
  compact: 'size-9',
  panel: 'h-9 px-3.5 text-xs font-semibold',
};

/**
 * Plain share intents rather than platform SDKs: no third-party script, no
 * tracking, and it works with JavaScript disabled. WhatsApp leads because it
 * is how local news actually circulates here. Each network keeps its own
 * colour on hover so the row is read by icon rather than by label.
 */
export function ShareLinks({
  url,
  headline,
  locale = 'en',
  variant = 'compact',
}: ShareLinksProps) {
  const dictionary = getDictionary(locale).article;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(headline);
  const isPanel = variant === 'panel';

  const targets = [
    {
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      hover:
        'hover:border-[#1da851] hover:bg-[#1da851] hover:text-white focus-visible:border-[#1da851]',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={ICON}
          aria-hidden
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.03 2.59c.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.14-1.19-.06-.1-.22-.17-.46-.29Z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hover:
        'hover:border-[#1877f2] hover:bg-[#1877f2] hover:text-white focus-visible:border-[#1877f2]',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={ICON}
          aria-hidden
        >
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
        </svg>
      ),
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      hover:
        'hover:border-ink hover:bg-ink hover:text-white focus-visible:border-ink',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={ICON}
          aria-hidden
        >
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.49-8.56L1 2.25h6.83l4.84 6.4 5.57-6.4Zm-1.16 17.52h1.83L6.01 4.13H4.05l13.03 15.64Z" />
        </svg>
      ),
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      hover:
        'hover:border-[#2481cc] hover:bg-[#2481cc] hover:text-white focus-visible:border-[#2481cc]',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={ICON}
          aria-hidden
        >
          <path d="M21.6 4.2 2.9 11.4c-.9.35-.9.9-.15 1.12l4.8 1.5 1.8 5.5c.22.6.4.84 1.02.84.47 0 .68-.22.94-.47l2.28-2.22 4.74 3.5c.87.48 1.5.23 1.72-.81l3.1-14.6c.3-1.27-.5-1.85-1.55-1.56Zm-3.6 4.1-8.5 7.7-.33 3.56-1.72-5.24 10.02-6.3c.44-.28.85-.13.53.28Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${isPanel ? 'flex-wrap' : ''}`}>
      {!isPanel && (
        <span className="text-ink-subtle mr-1 text-[11px] font-semibold tracking-widest uppercase">
          {dictionary.share}
        </span>
      )}

      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={dictionary.shareOn(target.label)}
          title={dictionary.shareOn(target.label)}
          className={`${BASE} ${IDLE} ${SIZE[variant]} ${target.hover}`}
        >
          {target.icon}
          {isPanel && <span>{target.label}</span>}
        </a>
      ))}

      <CopyLinkButton
        url={url}
        label={dictionary.copyLink}
        copiedLabel={dictionary.linkCopied}
        iconOnly={!isPanel}
        className={`${BASE} ${IDLE} ${SIZE[variant]} hover:border-brand hover:text-brand`}
        copiedClassName="border-brand! text-brand!"
      />
    </div>
  );
}
