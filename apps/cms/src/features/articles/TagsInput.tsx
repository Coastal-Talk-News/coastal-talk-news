import { Input } from '@coastal-talk-news/ui/input';
import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  tagMaxLength?: number;
}

/** Free text, author-entered — not a controlled taxonomy (docs/DATA-MODEL.md). */
export function TagsInput({
  value,
  onChange,
  max = 10,
  tagMaxLength = 40,
}: TagsInputProps) {
  const [draft, setDraft] = useState('');
  const atLimit = value.length >= max;

  function commit() {
    const tag = draft.trim().slice(0, tagMaxLength);
    setDraft('');
    if (!tag || atLimit) return;
    if (
      value.some((existing) => existing.toLowerCase() === tag.toLowerCase())
    ) {
      return;
    }
    onChange([...value, tag]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={atLimit}
        placeholder={
          atLimit ? `Up to ${max} tags` : 'Type a tag and press Enter'
        }
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="bg-surface-sunken text-ink-muted inline-flex items-center gap-1 rounded-full py-1 pr-1.5 pl-3 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((existing) => existing !== tag))
                }
                aria-label={`Remove tag ${tag}`}
                className="text-ink-subtle hover:text-ink-muted rounded-full p-0.5 transition-colors"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
