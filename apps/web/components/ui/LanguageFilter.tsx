import Link from 'next/link';
import type { SearchLanguage } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';

interface LanguageFilterProps {
  active: SearchLanguage;
  href: (language: SearchLanguage) => string;
  locale: Locale;
}

/**
 * A content filter, not a UI-language switcher — this changes which
 * language of *article* shows up in results, independent of the header's
 * toggle. Plain links so the filter works without client JS.
 */
export function LanguageFilter({ active, href, locale }: LanguageFilterProps) {
  const dictionary = getDictionary(locale).search;
  const options: Array<{ value: SearchLanguage; label: string }> = [
    { value: 'all', label: dictionary.languageAll },
    { value: 'en', label: dictionary.languageEnglish },
    { value: 'kn', label: dictionary.languageKannada },
  ];

  return (
    <div
      role="group"
      aria-label={dictionary.languageFilterLabel}
      className="flex items-center gap-2"
    >
      {options.map((option) =>
        option.value === active ? (
          <span
            key={option.value}
            aria-current="true"
            className="bg-brand rounded-full px-3.5 py-1.5 text-sm font-semibold text-white"
          >
            {option.label}
          </span>
        ) : (
          <Link
            key={option.value}
            href={href(option.value)}
            className="border-rule hover:border-brand hover:text-brand rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors"
          >
            {option.label}
          </Link>
        ),
      )}
    </div>
  );
}
