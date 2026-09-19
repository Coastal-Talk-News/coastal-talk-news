import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import {
  FACEBOOK_ICON_PATH,
  WHATSAPP_ICON_PATH,
  X_ICON_PATH,
} from '../layout/SocialLinks';
import { CopyLinkButton } from './CopyLinkButton';

interface ShareLinksProps {
  url: string;
  headline: string;
  locale?: Locale;
  /** `compact` is the icon row beside the dateline; `panel` ends the story. */
  variant?: 'compact' | 'panel';
  /** When set, the WhatsApp share text also invites the reader to the
   * channel matching this locale — English and Kannada each get their own
   * channel, same as the header/footer social links. */
  whatsappEnglishUrl?: string | null;
  whatsappKannadaUrl?: string | null;
}

// WhatsApp's own bold markup is *text*. Any asterisk already inside the text
// would end the bold early, so those are dropped.
const whatsappBold = (text: string) => `*${text.replaceAll('*', '').trim()}*`;

// Each channel's label is written in that channel's own language and shown the
// same way whichever UI locale the reader is on.
const ENGLISH_CHANNEL_LABEL = 'English Channel Link 👉 :';
const KANNADA_CHANNEL_LABEL = 'ಕನ್ನಡ ಚಾನೆಲ್ ಲಿಂಕ್ 👉 :';

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
  whatsappEnglishUrl,
  whatsappKannadaUrl,
}: ShareLinksProps) {
  const dictionary = getDictionary(locale).article;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(headline);
  const isPanel = variant === 'panel';

  // Both channels are always offered, regardless of which UI locale the
  // reader is currently on — a Kannada reader sharing a story may well have
  // English-reading contacts, and vice versa.
  const channelLines = [
    whatsappEnglishUrl &&
      `${whatsappBold(ENGLISH_CHANNEL_LABEL)}\n${whatsappEnglishUrl}`,
    whatsappKannadaUrl &&
      `${whatsappBold(KANNADA_CHANNEL_LABEL)}\n${whatsappKannadaUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  // Each URL sits on its own line, not appended after a label — WhatsApp's
  // link detector doesn't reliably linkify one that trails inline text.
  const whatsappMessage = [
    whatsappBold(headline),
    `${whatsappBold(dictionary.readLine)}\n${url}`,
    channelLines &&
      `${whatsappBold(dictionary.channelInvite)}\n${channelLines}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const targets = [
    {
      label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`,
      hover:
        'hover:border-[#1da851] hover:bg-[#1da851] hover:text-white focus-visible:border-[#1da851]',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={ICON}
          aria-hidden
        >
          <path d={WHATSAPP_ICON_PATH} />
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
          <path d={FACEBOOK_ICON_PATH} />
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
          <path d={X_ICON_PATH} />
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
