/** Where the reader site lives, so the editor can open previews there. */
export const WEB_URL: string | undefined =
  import.meta.env?.VITE_WEB_URL?.replace(/\/$/, '');

/**
 * The article's real, public address — only meaningful once it is published.
 * Built from the slug, as the reader site's canonical URL is; an article
 * without one yet is still reachable by its id.
 */
export function publicArticleUrl(article: {
  id: string;
  slug: string | null;
}): string | null {
  // Encoded, so a Kannada slug survives being pasted into WhatsApp.
  return WEB_URL
    ? `${WEB_URL}/article/${encodeURIComponent(article.slug ?? article.id)}`
    : null;
}
