'use client';

import type { PublicSiteSettingsDto } from '@coastal-talk-news/types';
import { useEffect, useRef, useState } from 'react';
import {
  ICON_PATHS,
  SOCIAL_BRAND,
  SOCIAL_BRAND_HOVER,
  SOCIAL_LABELS,
  SOCIAL_RING,
  WHATSAPP_ICON_PATH,
  type Platform,
} from './SocialLinks';
import { getClientLocale } from '../../lib/i18n/client';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface SocialChannelNotifierProps {
  settings: Pick<
    PublicSiteSettingsDto,
    | 'facebookUrl'
    | 'instagramUrl'
    | 'youtubeUrl'
    | 'xUrl'
    | 'whatsappEnglishUrl'
    | 'whatsappKannadaUrl'
  >;
  locale: Locale;
}

export function SocialChannelNotifier({
  settings,
  locale,
}: SocialChannelNotifierProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [open, setOpen] = useState(true);
  const [socialsOpen, setSocialsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>('whatsapp');
  const notifierRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setActiveLocale(getClientLocale());

    const handleLocaleChange = () => setActiveLocale(getClientLocale());
    window.addEventListener('ctn:locale-change', handleLocaleChange);
    return () =>
      window.removeEventListener('ctn:locale-change', handleLocaleChange);
  }, [locale]);

  useEffect(() => {
    if (!socialsOpen && !open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !notifierRef.current?.contains(target)) {
        setSocialsOpen(false);
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open, socialsOpen]);

  const dictionary = getDictionary(activeLocale).article;
  const channelUrl =
    activeLocale === 'kn'
      ? settings.whatsappKannadaUrl
      : settings.whatsappEnglishUrl;
  const socialLinks = [
    { platform: 'facebook' as const, href: settings.facebookUrl },
    { platform: 'instagram' as const, href: settings.instagramUrl },
    { platform: 'youtube' as const, href: settings.youtubeUrl },
    { platform: 'x' as const, href: settings.xUrl },
    { platform: 'whatsapp' as const, href: channelUrl },
  ].filter((link): link is { platform: Platform; href: string } =>
    Boolean(link.href),
  );

  const activeSocialLink = socialLinks.find(
    (link) => link.platform === activePlatform,
  );
  const selectedLink = activeSocialLink ?? socialLinks[0];

  if (!selectedLink) return null;

  const activeIsWhatsApp = selectedLink.platform === 'whatsapp';
  const notifierTitle = activeIsWhatsApp
    ? dictionary.channelNotifierTitle
    : dictionary.socialNotifierTitle;
  const notifierDescription = activeIsWhatsApp
    ? dictionary.channelNotifierDescription
    : dictionary.socialNotifierDescription;
  const notifierCta = activeIsWhatsApp
    ? dictionary.channelNotifierCta
    : dictionary.socialNotifierCta(SOCIAL_LABELS[selectedLink.platform]);

  function selectSocial(platform: Platform) {
    setActivePlatform(platform);
    setSocialsOpen(false);
    setOpen(true);
  }

  function activateMain() {
    setOpen((current) => !current);
  }

  return (
    <aside
      ref={notifierRef}
      aria-label={dictionary.channelNotifierTitle}
      data-social-channel-notifier
      className="fixed right-6 bottom-7 z-40 size-12 sm:right-8 sm:bottom-10"
    >
      {!open && socialLinks.length > 1 && (
        <button
          type="button"
          onClick={() => setSocialsOpen((current) => !current)}
          aria-label={socialsOpen ? 'Close social links' : 'Open social links'}
          aria-expanded={socialsOpen}
          className="border-rule absolute top-0 right-1/2 z-20 flex size-7 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-2 bg-paper text-ink-muted shadow-sm transition-colors hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden
          >
            <path d={socialsOpen ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} />
          </svg>
        </button>
      )}

      <div
        className={`absolute right-0 bottom-full mb-9 flex flex-col items-center gap-2 transition-all duration-300 ease-out motion-reduce:transition-none ${
          socialsOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        }`}
        aria-hidden={!socialsOpen}
      >
        {socialLinks.map((link) => (
          <button
            key={link.platform}
            type="button"
            onClick={() => selectSocial(link.platform)}
            aria-label={SOCIAL_LABELS[link.platform]}
            title={SOCIAL_LABELS[link.platform]}
            className={`grid size-9 cursor-pointer place-items-center rounded-full bg-paper text-ink-muted shadow-[0_5px_16px_rgb(0_0_0/0.16)] transition-colors hover:text-white ${SOCIAL_BRAND_HOVER[link.platform]} ${
              activePlatform === link.platform
                ? `ring-2 ring-offset-2 ${SOCIAL_RING[link.platform]}`
                : ''
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
              aria-hidden
            >
              {ICON_PATHS[link.platform]}
            </svg>
          </button>
        ))}
      </div>

      <div
        id="social-channel-notifier-panel"
        className={`absolute right-0 bottom-full mb-3 origin-bottom-right transition-all duration-300 ease-out motion-reduce:transition-none ${
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="social-channel-notifier-panel border-rule bg-paper w-[min(22rem,calc(100vw-1.5rem))] rounded-card border p-4 shadow-[0_12px_35px_rgb(0_0_0/0.16)] sm:p-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${SOCIAL_BRAND[selectedLink.platform]}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
                aria-hidden
              >
                {ICON_PATHS[selectedLink.platform]}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-ink text-sm font-bold">{notifierTitle}</h2>
              <p className="text-ink-muted mt-1 text-sm leading-snug">
                {notifierDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={
                activeIsWhatsApp
                  ? dictionary.channelNotifierClose
                  : dictionary.socialNotifierClose
              }
              className="text-ink-subtle hover:text-ink -m-1 cursor-pointer rounded-full p-1 transition-colors"
            >
              <span aria-hidden className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>
          <a
            href={selectedLink.href}
            target="_blank"
            rel="noreferrer"
            tabIndex={open ? 0 : -1}
            className={`mt-3 inline-flex cursor-pointer items-center justify-center rounded-sm px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-4 ${SOCIAL_BRAND[selectedLink.platform]} ${SOCIAL_BRAND_HOVER[selectedLink.platform]}`}
          >
            {notifierCta}
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={activateMain}
        aria-label={
          activeIsWhatsApp
            ? open
              ? dictionary.channelNotifierClose
              : dictionary.channelNotifierOpen
            : open
              ? dictionary.socialNotifierClose
              : dictionary.socialNotifierOpen
        }
        aria-expanded={activeIsWhatsApp ? open : undefined}
        aria-controls="social-channel-notifier-panel"
        className={`absolute right-0 bottom-0 flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)] transition-all duration-300 ease-out hover:shadow-[0_10px_28px_rgb(0_0_0/0.24)] motion-reduce:transition-none ${SOCIAL_BRAND[activePlatform]} ${SOCIAL_BRAND_HOVER[activePlatform]}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-7"
          aria-hidden
        >
          {ICON_PATHS[activePlatform] ?? <path d={WHATSAPP_ICON_PATH} />}
        </svg>
      </button>
    </aside>
  );
}
