import type { Locale } from './i18n/types';

/**
 * A category's name in the reader's language. Categories saved before the
 * Kannada name was required have none, so they show their English name
 * rather than a blank.
 */
export function categoryName(
  category: { name: string; nameKannada: string | null },
  locale: Locale,
): string {
  return locale === 'kn' && category.nameKannada
    ? category.nameKannada
    : category.name;
}
