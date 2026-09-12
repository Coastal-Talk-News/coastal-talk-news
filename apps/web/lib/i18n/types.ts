export type Locale = 'en' | 'kn';

/** Kept out of `next/headers`-importing files so client code can read/write it too. */
export const LOCALE_COOKIE = 'ctn_ui_locale';

export const DEFAULT_LOCALE: Locale = 'kn';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'kn';
}
