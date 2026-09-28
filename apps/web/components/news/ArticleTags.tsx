interface ArticleTagsProps {
  tags: string[];
  label: string;
}

function TagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d="M12.59 2.59a2 2 0 0 0-1.41-.59H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8 8a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82Z" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Plain labels, not links: tags are free text with no controlled vocabulary
 * (see docs/DATA-MODEL.md), so there is nowhere for one to point to yet.
 */
export function ArticleTags({ tags, label }: ArticleTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="border-rule mt-8 border-t pt-6">
      <div className="text-ink-subtle flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
        <TagIcon />
        {label}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <span className="bg-brand-soft text-brand border-brand/10 rounded-full border px-3.5 py-1.5 text-sm font-medium">
              {tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
