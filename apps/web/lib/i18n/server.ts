import { cookies } from 'next/headers';
import { getSite } from '../api';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './types';

const LOCALE_BY_LANGUAGE = {
  ENGLISH: 'en',
  KANNADA: 'kn',
} as const satisfies Record<string, Locale>;

/**
 * Server Components only. `getSite` is a cached fetch the layout makes anyway,
 * so falling back to the newsroom's default costs nothing extra.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  try {
    const { settings } = await getSite();
    return LOCALE_BY_LANGUAGE[settings.defaultUiLanguage] ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
