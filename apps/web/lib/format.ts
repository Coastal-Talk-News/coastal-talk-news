const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const relativeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

/** Falls back to an absolute date once a story is more than a week old. */
export function formatTimeAgo(iso: string): string {
  const deltaMs = new Date(iso).getTime() - Date.now();
  if (Math.abs(deltaMs) > 7 * 24 * 60 * 60 * 1000) {
    return formatDate(iso);
  }
  for (const [unit, unitMs] of UNITS) {
    if (Math.abs(deltaMs) >= unitMs) {
      return relativeFormatter.format(Math.round(deltaMs / unitMs), unit);
    }
  }
  return 'just now';
}
