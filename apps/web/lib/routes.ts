/**
 * Every link to an article or a section is built here, so the whole site
 * agrees on one address per page — the one search engines are told is
 * canonical. Both are addressed by slug; the API falls back to the id for a
 * row without one yet, which the pages also accept.
 */

/** What an article is addressed by: its slug, else its id. */
export function articleKey(article: { id?: string; slug?: string }): string {
  // The id fallback matters just after a deploy: cached API responses from
  // before slugs can still be served for a minute, and a link must never
  // read /article/undefined.
  return article.slug || article.id || '';
}

/** Encoded, so a Kannada slug survives any app it is pasted into. */
export function articlePath(article: { id?: string; slug?: string }): string {
  return `/article/${encodeURIComponent(articleKey(article))}`;
}

export function categoryPath(category: { slug: string }): string {
  return `/category/${encodeURIComponent(category.slug)}`;
}

const LEADING_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const LEADING_SLUG = /^[\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{M}\p{N}]+)*/u;

/**
 * What to look an article up by, from the (decoded) segment of its address:
 * an id (a link shared before slugs) or a slug — or null when it holds
 * neither.
 *
 * Links pasted into chat apps often come back damaged: WhatsApp runs a full
 * stop or a bracket into the link, and some apps upper-case it. The intact
 * part at the front is kept — never guessed at — and the page redirects to
 * the article's real address in one hop.
 */
export function articleKeyFrom(segment: string): string | null {
  const uuid = LEADING_UUID.exec(segment);
  if (uuid) return uuid[0].toLowerCase();
  return (
    LEADING_SLUG.exec(segment.normalize('NFC').toLowerCase())?.[0] ?? null
  );
}

/** A route parameter as the reader typed it: Kannada slugs can arrive still
 * percent-encoded, depending on how the URL reached the server. */
export function decodeParam(value: string): string {
  if (!value.includes('%')) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
