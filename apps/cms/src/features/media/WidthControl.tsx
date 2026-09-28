import {
  IMAGE_WIDTH_MAX_PERCENT,
  IMAGE_WIDTH_MIN_PERCENT,
} from '@coastal-talk-news/validation/limits';
import { useEffect, useState } from 'react';
import { clampWidth } from './imageFrame.js';

interface WidthControlProps {
  value: number;
  onChange: (widthPercent: number) => void;
  /** A slider beside the box, for a control with room to spare. */
  slider?: boolean;
}

/**
 * Typing is held back until the box is left or Enter is pressed, so a width
 * can be typed a digit at a time without each half-typed number being applied.
 */
export function WidthControl({ value, onChange, slider }: WidthControlProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const parsed = Number(draft);
    if (draft.trim() === '' || Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clampWidth(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return (
    <label className="text-ink-muted flex items-center gap-2 text-xs font-medium">
      Width
      {slider && (
        <input
          type="range"
          min={IMAGE_WIDTH_MIN_PERCENT}
          max={IMAGE_WIDTH_MAX_PERCENT}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="accent-accent h-1 w-40 cursor-pointer"
          aria-label="Image width"
        />
      )}
      <span className="border-hairline bg-surface focus-within:ring-accent flex h-8 items-center rounded-md border pr-2 pl-2 focus-within:ring-2">
        <input
          type="number"
          inputMode="numeric"
          min={IMAGE_WIDTH_MIN_PERCENT}
          max={IMAGE_WIDTH_MAX_PERCENT}
          value={draft}
          aria-label="Width in percent"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commit();
          }}
          className="text-ink w-9 [appearance:textfield] bg-transparent text-right text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-ink-subtle ml-0.5 text-sm">%</span>
      </span>
    </label>
  );
}
