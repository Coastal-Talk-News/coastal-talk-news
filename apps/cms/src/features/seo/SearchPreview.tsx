interface SearchPreviewProps {
  siteName: string;
  title: string;
  url: string | null;
  description: string;
}

/** A Kannada address shown in Kannada, as a browser's address bar shows it,
 * rather than as a column of %E0%B2… escapes. */
function decodeUrl(url: string): string {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
}

/**
 * Roughly how a search result could look, drawn from the form as it is typed:
 * no request is made until the form is saved. Only an illustration — the
 * search engine decides what it actually shows.
 */
export function SearchPreview({
  siteName,
  title,
  url,
  description,
}: SearchPreviewProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-ink-muted block text-sm font-medium">
        Search preview
      </span>
      <div className="border-hairline rounded-lg border bg-surface-sunken p-3">
        {/* Everything wraps and nothing is clipped: the editor is checking
            the full text, and a long Kannada URL or title must be readable. */}
        <p className="text-ink-subtle text-xs break-words">{siteName}</p>
        {url && (
          <p className="text-ink-subtle text-xs break-all">{decodeUrl(url)}</p>
        )}
        <p className="mt-1 text-[15px] font-medium break-words text-accent-text">
          {title || 'Untitled'}
        </p>
        <p className="text-ink-muted mt-0.5 text-xs leading-relaxed break-words">
          {description || 'No description yet.'}
        </p>
      </div>
      <p className="text-ink-subtle text-xs">
        Search preview only — Google may display a different title or snippet.
      </p>
    </div>
  );
}

/** "52 / about 50–60 recommended" — guidance, never a limit or a score. */
export function lengthHint(length: number, min: number, max: number): string {
  return `${length} characters · about ${min}–${max} recommended`;
}
