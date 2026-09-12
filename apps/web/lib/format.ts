import type { Locale } from './i18n/types';

// Node ships full ICU, so 'kn-IN' renders real Kannada month/weekday names
// rather than falling back to transliterated Latin ones.
const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  kn: new Intl.DateTimeFormat('kn-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
};

const dateTimeFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
  kn: new Intl.DateTimeFormat('kn-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
};

const longDateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  kn: new Intl.DateTimeFormat('kn-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
};

const relativeFormatters: Record<Locale, Intl.RelativeTimeFormat> = {
  en: new Intl.RelativeTimeFormat('en', { numeric: 'auto' }),
  kn: new Intl.RelativeTimeFormat('kn', { numeric: 'auto' }),
};

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

export function formatDate(iso: string, locale: Locale = 'en'): string {
  return dateFormatters[locale].format(new Date(iso));
}

/** Articles carry a byline date and time, unlike the relative card labels. */
export function formatDateTime(iso: string, locale: Locale = 'en'): string {
  return dateTimeFormatters[locale].format(new Date(iso));
}

export function formatLongDate(date: Date, locale: Locale = 'en'): string {
  return longDateFormatters[locale].format(date);
}

/** Falls back to an absolute date once a story is more than a week old. */
export function formatTimeAgo(
  iso: string,
  locale: Locale = 'en',
  justNowLabel = 'just now',
): string {
  const deltaMs = new Date(iso).getTime() - Date.now();
  if (Math.abs(deltaMs) > 7 * 24 * 60 * 60 * 1000) {
    return formatDate(iso, locale);
  }
  for (const [unit, unitMs] of UNITS) {
    if (Math.abs(deltaMs) >= unitMs) {
      return relativeFormatters[locale].format(
        Math.round(deltaMs / unitMs),
        unit,
      );
    }
  }
  return justNowLabel;
}
