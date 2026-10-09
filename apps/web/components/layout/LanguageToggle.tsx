'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { getClientLocale, setClientLocale } from '../../lib/i18n/client';
import type { Locale } from '../../lib/i18n/types';

export function LanguageToggle({
  locale,
  className = '',
}: {
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveLocale(getClientLocale());

    const handleLocaleChange = () => setActiveLocale(getClientLocale());
    window.addEventListener('ctn:locale-change', handleLocaleChange);
    return () =>
      window.removeEventListener('ctn:locale-change', handleLocaleChange);
  }, [locale]);

  function select(next: Locale) {
    if (next === activeLocale) return;
    setActiveLocale(next);
    setClientLocale(next);
    startTransition(() => {
      if (pathname?.startsWith('/article/')) {
        router.replace('/');
        return;
      }
      // The cookie only takes effect on the next request — refresh re-fetches
      // this route's server-rendered content (site chrome included) with it.
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      // Two equal columns rather than two content-width buttons: "ENGLISH"
      // is wider than the Kannada label, and a lopsided pair reads as a
      // mistake rather than as a switch.
      className={`border-rule inline-grid shrink-0 grid-cols-2 overflow-hidden rounded-sm border text-xs font-bold ${className}`}
    >
      <button
        type="button"
        onClick={() => select('en')}
        aria-pressed={activeLocale === 'en'}
        disabled={isPending}
        className={`px-2.5 py-1 transition-colors disabled:opacity-60 ${
          activeLocale === 'en'
            ? 'bg-brand text-white'
            : 'hover:bg-paper-sunken text-ink-muted'
        }`}
      >
        ENGLISH
      </button>
      <button
        type="button"
        onClick={() => select('kn')}
        aria-pressed={activeLocale === 'kn'}
        disabled={isPending}
        className={`border-rule border-l px-2.5 py-1 transition-colors disabled:opacity-60 ${
          activeLocale === 'kn'
            ? 'bg-brand text-white'
            : 'hover:bg-paper-sunken text-ink-muted'
        }`}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
