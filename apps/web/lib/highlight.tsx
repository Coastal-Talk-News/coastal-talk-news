import type { ReactNode } from 'react';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Wraps every case-insensitive occurrence of a search query's words in
 * <mark> — the same idea as a browser's in-page (Ctrl+F) find highlighting,
 * so a reader can see why a result matched without opening it. The backend
 * matches each word of the query independently (see
 * apps/api/src/modules/articles/repository.ts's toPrefixQuery), so this
 * highlights the same way rather than requiring the whole phrase verbatim.
 */
export function highlightMatches(text: string, query: string): ReactNode {
  const words = Array.from(
    new Set(
      query
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 0),
    ),
  );
  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  // Splitting on a single capturing group puts each match at an odd index
  // and the untouched text between matches at even indices — no need to
  // re-run the (stateful, global) regex per part to tell them apart.
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded-sm bg-yellow-300 px-0.5 text-inherit"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
