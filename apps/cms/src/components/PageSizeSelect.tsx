import { Select, type SelectOption } from '@coastal-talk-news/ui/select';
import { useEffect, useState } from 'react';

const PRESETS = [5, 10, 20] as const;
const CUSTOM_MIN = 1;
const CUSTOM_MAX = 100;

type Choice = '5' | '10' | '20' | 'custom';

function isPreset(value: number): value is (typeof PRESETS)[number] {
  return (PRESETS as readonly number[]).includes(value);
}

interface PageSizeSelectProps {
  value: number;
  onChange: (limit: number) => void;
}

/**
 * 5 / 10 / 20, or Custom for anything else up to 100. Typing past 100 is
 * refused outright rather than just clamped afterwards — the max is stated
 * once, right by the field, instead of surprising someone after the fact.
 */
export function PageSizeSelect({ value, onChange }: PageSizeSelectProps) {
  const [customOpen, setCustomOpen] = useState(!isPreset(value));
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setCustomOpen(!isPreset(value));
    setDraft(String(value));
  }, [value]);

  const choice: Choice = customOpen ? 'custom' : (String(value) as Choice);
  const options: Array<SelectOption<Choice>> = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '20', label: '20 per page' },
    {
      value: 'custom',
      label: customOpen ? 'Custom' : `Custom (up to ${CUSTOM_MAX})`,
    },
  ];

  function handleDraftChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    // Refused, not clamped: a value over the max is simply not accepted as
    // typed, so the field can never show a number it will have to correct.
    if (digits !== '' && Number(digits) > CUSTOM_MAX) return;
    setDraft(digits);
  }

  function commit() {
    if (draft === '') {
      setDraft(String(value));
      return;
    }
    const next = Math.max(CUSTOM_MIN, Number(draft));
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-subtle whitespace-nowrap text-xs">
        Rows per page
      </span>
      <Select
        size="sm"
        className="h-8 w-40"
        value={choice}
        options={options}
        aria-label="Rows per page"
        onValueChange={(next) => {
          if (next === 'custom') {
            setCustomOpen(true);
            return;
          }
          setCustomOpen(false);
          onChange(Number(next));
        }}
      />

      {customOpen && (
        <span className="flex items-center gap-1.5">
          <span className="border-hairline bg-surface focus-within:ring-accent flex h-8 items-center rounded-md border pr-2 pl-2.5 focus-within:ring-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={draft}
              placeholder="1–100"
              aria-label={`Custom rows per page, ${CUSTOM_MIN} to ${CUSTOM_MAX}`}
              onChange={(event) => handleDraftChange(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                commit();
              }}
              className="text-ink w-10 bg-transparent text-sm tabular-nums outline-none"
            />
          </span>
          <span className="text-ink-subtle text-[11px] whitespace-nowrap">
            Max {CUSTOM_MAX} items
          </span>
        </span>
      )}
    </div>
  );
}
