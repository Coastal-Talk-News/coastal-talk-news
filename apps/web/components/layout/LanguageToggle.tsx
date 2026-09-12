'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setClientLocale } from '../../lib/i18n/client';
import type { Locale } from '../../lib/i18n/types';

export function LanguageToggle({
  locale,
  className = '',
}: {
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(next: Locale) {
    if (next === locale) return;
    setClientLocale(next);
    // The cookie only takes effect on the next request — refresh re-fetches
    // this route's server-rendered content (site chrome included) with it.
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={`border-rule inline-flex shrink-0 overflow-hidden rounded-sm border text-xs font-bold ${className}`}
    >
      <button
        type="button"
        onClick={() => select('en')}
        aria-pressed={locale === 'en'}
        disabled={isPending}
        className={`px-2.5 py-1 transition-colors disabled:opacity-60 ${
          locale === 'en'
            ? 'bg-brand text-white'
            : 'hover:bg-paper-sunken text-ink-muted'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => select('kn')}
        aria-pressed={locale === 'kn'}
        disabled={isPending}
        className={`border-rule border-l px-2.5 py-1 transition-colors disabled:opacity-60 ${
          locale === 'kn'
            ? 'bg-brand text-white'
            : 'hover:bg-paper-sunken text-ink-muted'
        }`}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
