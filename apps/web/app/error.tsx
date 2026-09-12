'use client';

import { getClientLocale } from '../lib/i18n/client';
import { getDictionary } from '../lib/i18n/dictionaries';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  // A Server Component would read the locale cookie via `next/headers`, but
  // this boundary is a Client Component (error boundaries must be), so it
  // reads the same cookie straight off the browser instead.
  const dictionary = getDictionary(getClientLocale());

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {dictionary.errorPage.heading}
      </h1>
      <p className="text-ink-muted mt-3 max-w-md leading-relaxed">
        {dictionary.errorPage.description}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand hover:bg-brand-hover mt-8 inline-flex h-11 items-center rounded-sm px-6 text-sm font-semibold text-white transition-colors"
      >
        {dictionary.errorPage.tryAgain}
      </button>
    </div>
  );
}
