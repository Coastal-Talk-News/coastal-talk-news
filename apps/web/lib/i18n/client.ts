import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './types';

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
 *
 * No max-age, on purpose: the choice lasts for the visit and is not kept for
 * the next one (see proxy.ts, which also resets it when a new visit begins).
 */
export function setClientLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; samesite=lax`;
}
