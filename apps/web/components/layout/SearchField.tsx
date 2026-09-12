'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

export function SearchField({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const inputId = useId();
  const dictionary = getDictionary(locale);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative">
      <label htmlFor={inputId} className="sr-only">
        {dictionary.header.searchLabel}
      </label>
      <input
        id={inputId}
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={dictionary.header.searchPlaceholder}
        className="border-rule bg-paper-sunken placeholder:text-ink-subtle focus:border-brand h-10 w-full rounded-sm border pr-3 pl-9 text-sm transition-colors focus:bg-white focus:outline-none"
      />
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        className="text-ink-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="m13.5 13.5 3 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </form>
  );
}
