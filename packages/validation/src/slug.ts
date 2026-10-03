/**
 * URL slugs for articles and categories. Shared so the API (which saves them)
 * and the CMS (which previews them while typing) can never disagree about what
 * a slug is.
 *
 * Letters from any script are kept, so a Kannada headline gets a readable
 * Kannada slug. Combining marks count as part of a word: Kannada writes its
 * vowel signs as marks, and dropping them would mangle every word.
 */

export const SLUG_MAX = 120;

/** Words of letters, marks and digits joined by single hyphens. */
export const SLUG_PATTERN =
  '^[\\p{L}\\p{M}\\p{N}]+(?:-[\\p{L}\\p{M}\\p{N}]+)*$';

const SLUG_REGEX = new RegExp(SLUG_PATTERN, 'u');

/** A UUID-shaped slug would be read as an id by the public routes. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= SLUG_MAX &&
    value === value.toLowerCase() &&
    SLUG_REGEX.test(value) &&
    !isUuid(value)
  );
}

/** What an editor typed, tidied the forgiving way: spaces trimmed, letters
 * lowercased. Anything still invalid after this is reported, not guessed at. */
export function normalizeSlugInput(value: string): string {
  return value.trim().normalize('NFC').toLowerCase();
}

/**
 * Turns a headline or name into a slug: lowercase, punctuation and spaces
 * become single hyphens. Apostrophes and dots inside abbreviations are
 * dropped rather than split on, so "Editor's Choice" reads "editors-choice"
 * and "U.S.A" reads "usa". Returns an empty string when nothing usable is
 * left; callers supply their own fallback.
 */
export function slugify(text: string): string {
  const words = text
    .normalize('NFC')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/(?<=\p{L})\.(?=\p{L})/gu, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return truncateAtWord(words, SLUG_MAX);
}

/** Cut at the last hyphen that fits, so no word is split in half. */
function truncateAtWord(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const lastHyphen = cut.lastIndexOf('-');
  return (lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, '');
}

/**
 * Article slugs follow the headline's own language: an English headline gives
 * "udupi-heavy-rain-alert", a Kannada one "ಉಡುಪಿಯಲ್ಲಿ-ಭಾರಿ-ಮಳೆ". Words of
 * letters (any script, with their vowel signs), digits, joined by single
 * hyphens, lowercase — and never shaped like a uuid, which old links use.
 */
export const ARTICLE_SLUG_MAX = 80;

/** Where generated slugs stop, at a word boundary: enough words to identify
 * the story, never the whole headline. */
const ARTICLE_SLUG_TARGET = 60;

export function isValidArticleSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= ARTICLE_SLUG_MAX &&
    value === value.toLowerCase() &&
    value === value.normalize('NFC') &&
    SLUG_REGEX.test(value) &&
    !isUuid(value)
  );
}

/**
 * The slug a headline or title gives. Accents on Latin letters are dropped
 * ("café" → "cafe"); Kannada keeps its vowel signs, and the invisible joiners
 * Kannada typing inserts (ZWJ/ZWNJ, like every invisible format character) are
 * removed rather than splitting a word.
 * Emoji and punctuation become hyphens.
 */
export function articleSlugify(text: string): string {
  const words = text
    .normalize('NFC')
    .replace(/\p{Script=Latin}/gu, (letter) =>
      letter.normalize('NFKD').replace(/\p{M}/gu, ''),
    )
    .replace(/\p{Cf}/gu, '')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/(?<=\p{L})\.(?=\p{L})/gu, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  if (words.length <= ARTICLE_SLUG_TARGET) return words;
  // A shortened headline shouldn't stop on a linking word ("…-awards-at").
  return truncateAtWord(words, ARTICLE_SLUG_TARGET).replace(
    TRAILING_LINK_WORDS,
    '',
  );
}

const TRAILING_LINK_WORDS =
  /(?:-(?:a|an|and|as|at|by|for|from|in|into|of|on|or|over|the|to|via|with))+$/;

/**
 * The slug a new article gets when the editor leaves the field empty: from
 * the headline, else the SEO title (for a headline of only symbols).
 */
export function suggestArticleSlug(article: {
  headline: string;
  seoTitle?: string | null;
}): string {
  return (
    articleSlugify(article.headline) || articleSlugify(article.seoTitle ?? '')
  );
}
