import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './types';

/**
 * Server Components only. A reader's own choice (the toggle's cookie) wins;
 * a first-time visitor gets the fixed DEFAULT_LOCALE — the same value the
 * client-side toggle falls back to, so the two can never disagree.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}
