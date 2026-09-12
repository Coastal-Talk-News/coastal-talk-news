import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './types';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Client Components only (e.g. the toggle itself, and the error boundary,
 * which can't call the Server-only `getLocale`). Reads the same cookie a
 * Server Component reads, straight off `document.cookie`.
 */
export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
  );
  const value = match ? decodeURIComponent(match[1] ?? '') : undefined;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Sets the cookie a Server Component's `getLocale()` will read on the next
 * request. Plain `document.cookie`, not Next's `cookies()` API — that one
 * can only be written from a Server Function or Route Handler, and a toggle
 * click doesn't need either for something this simple.
 */
export function setClientLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
