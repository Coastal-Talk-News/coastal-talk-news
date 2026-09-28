/** Where the reader site lives, so the editor can open previews there. */
export const WEB_URL: string | undefined =
  import.meta.env?.VITE_WEB_URL?.replace(/\/$/, '');

/** The article's real, public address — only meaningful once it is published. */
export function publicArticleUrl(id: string): string | null {
  return WEB_URL ? `${WEB_URL}/article/${id}` : null;
}
