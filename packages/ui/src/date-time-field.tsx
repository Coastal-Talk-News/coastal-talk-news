import * as Popover from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Calendar } from './calendar.js';
import { cn } from './cn.js';

const displayFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDisplay(value: string): string | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return displayFormatter.format(new Date(year, month - 1, day));
}

// Clock order, not counting order - 12 leads, same as every analog and
// digital clock face - and zero-padded to line up with the minute column
// next to it ("01", not "1").
const HOUR_ORDER = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const HOUR_OPTIONS = HOUR_ORDER.map((hour) => {
  const padded = String(hour).padStart(2, '0');
  return { value: padded, label: padded };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => ({
  value: String(minute).padStart(2, '0'),
  label: String(minute).padStart(2, '0'),
}));

const PERIOD_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

interface TimeParts {
  hour: string;
  minute: string;
  period: string;
}

/** Splits a 24-hour "HH:mm" into the three segments the field shows. Any
 * piece that can't be read back out leaves every segment blank, so the field
 * shows its placeholders rather than a wrong time. */
function toParts(value: string): TimeParts {
  const [hourStr, minute] = value.split(':');
  const hour = Number(hourStr);
  if (!minute || Number.isNaN(hour) || hour < 0 || hour > 23) {
    return { hour: '', minute: '', period: '' };
  }
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return {
    hour: String(hour12).padStart(2, '0'),
    minute,
    period: hour < 12 ? 'AM' : 'PM',
  };
}

/** The inverse of toParts. A segment left blank (nothing picked yet) defaults
 * to noon/midnight's hour and :00, so setting just one of the three still
 * produces a complete, valid time rather than nothing at all. */
function fromParts({ hour, minute, period }: TimeParts): string {
  const hour12 = Number(hour || '12') % 12;
  const hour24 = period === 'PM' ? hour12 + 12 : hour12;
  return `${String(hour24).padStart(2, '0')}:${minute || '00'}`;
}

interface TimeOption {
  value: string;
  label: string;
}

/** Matches typed digits against an option two ways: as a straight prefix of
 * its label ("0" -> "00".."09"), and as a prefix of its plain numeric value
 * ("5" -> "05", "50".."59") - the padded zero in "05" shouldn't stop someone
 * typing "5" from finding it, which a plain label-prefix match alone would
 * do. */
function optionMatches(option: TimeOption, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (option.label.toLowerCase().startsWith(q)) return true;
  const numeric = Number(option.value);
  return !Number.isNaN(numeric) && String(numeric).startsWith(q);
}

interface TimeSegmentProps {
  value: string;
  options: TimeOption[];
  placeholder: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  widthClassName: string;
  disabled?: boolean;
  /** An option this segment could never legally settle on, given whatever
   * the other two segments are currently set to - e.g. on the end field,
   * picking "10" here when the other two already spell out a time at or
   * before the start. Shown but unselectable, the same way the calendar
   * greys out an earlier day rather than hiding it. */
  isOptionDisabled?: (value: string) => boolean;
  'aria-label': string;
}

/**
 * One clickable/typeable piece of the "10 : 27 AM" display - not a full
 * Select (its own border, ring and chevron read as a separate boxed control,
 * which is exactly what made three of them side by side look like three
 * controls bolted together rather than one). This has no chrome of its own:
 * it renders as a bare inline input inside the field's single shared shell,
 * the way a native time input's own hour/minute/period segments do.
 *
 * It's a combobox, not a picker: opening it drops a genuinely scrolling list
 * (scrolled to the current value already, so nothing needs hunting for) and
 * typing digits filters that list down further. The scrollbar itself is
 * hidden - overflow-y:auto still does the scrolling, only the browser's own
 * scrollbar chrome is suppressed - since a visible track was reading as part
 * of the design rather than as a hint that the list scrolls.
 */
function TimeSegment({
  value,
  options,
  placeholder,
  onChange,
  numeric,
  widthClassName,
  disabled,
  isOptionDisabled,
  ...props
}: TimeSegmentProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const label = options.find((option) => option.value === value)?.label ?? '';
  const filtered =
    query === null ? options : options.filter((o) => optionMatches(o, query));

  useEffect(() => {
    if (!open || !listRef.current) return;
    if (query === null) {
      const selected = listRef.current.querySelector<HTMLElement>(
        `[data-value="${CSS.escape(value)}"]`,
      );
      if (selected) {
        selected.scrollIntoView({ block: 'center' });
        return;
      }
    }
    listRef.current.scrollTop = 0;
  }, [open, query, value]);

  function select(next: string) {
    onChange(next);
    setQuery(null);
    setOpen(false);
  }

  function close() {
    setOpen(false);
    setQuery(null);
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <Popover.Anchor asChild>
        <input
          type="text"
          inputMode={numeric ? 'numeric' : 'text'}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={props['aria-label']}
          value={query ?? label}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value.replace(/[^0-9a-zA-Z]/g, ''));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              const match = filtered.find(
                (option) => !isOptionDisabled?.(option.value),
              );
              if (match) select(match.value);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
          className={cn(
            'rounded py-0.5 text-sm tabular-nums transition-colors',
            'focus:ring-accent focus:outline-none focus:ring-2',
            'hover:bg-surface-sunken',
            'disabled:pointer-events-none disabled:opacity-60',
            'bg-transparent text-center',
            label ? 'text-ink' : 'text-ink-subtle',
            widthClassName,
          )}
        />
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="border-hairline bg-surface-raised data-[state=open]:animate-fade-in z-50 w-24 overflow-hidden rounded-lg border shadow-lg"
        >
          <ul
            ref={listRef}
            role="listbox"
            // The Sheet this opens inside is a Dialog with its own scroll
            // lock, which - by default - treats a wheel/touch event as
            // belonging to the page behind it unless told otherwise, even
            // once it's confirmed this list itself has room to scroll.
            // Stopping propagation here keeps the event as this list's own,
            // the same way a native <select> popup's scroll never leaks to
            // the page under it.
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            className={cn(
              'max-h-52 overflow-y-auto overscroll-contain p-1',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {filtered.length === 0 ? (
              <li className="text-ink-subtle px-2 py-1.5 text-sm">No match</li>
            ) : (
              filtered.map((option) => {
                const optionDisabled =
                  isOptionDisabled?.(option.value) ?? false;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    aria-disabled={optionDisabled || undefined}
                  >
                    <button
                      type="button"
                      data-value={option.value}
                      disabled={optionDisabled}
                      onClick={() => select(option.value)}
                      className={cn(
                        'w-full rounded-md px-2 py-1.5 text-left text-sm tabular-nums transition-colors',
                        'hover:bg-surface-sunken focus:outline-none focus-visible:ring-accent focus-visible:ring-2',
                        'disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent',
                        option.value === value
                          ? 'bg-accent-soft text-ink font-medium'
                          : 'text-ink-muted',
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface DateTimeFieldProps {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  dateLabel?: string;
  timeLabel?: string;
  /** The other end of the pair this field can't fall before - e.g. the end
   * field is given the start field's own date/time. Earlier calendar days
   * are greyed out outright; on the day they're equal, whichever hour /
   * minute / AM-PM combination would land at or before this moment is
   * greyed out too, so a bad pair can't be picked in the first place rather
   * than being caught by a message after the fact. */
  minDate?: string;
  minTime?: string;
}

export function DateTimeField({
  date,
  time,
  onDateChange,
  onTimeChange,
  id,
  invalid,
  disabled,
  dateLabel = 'Choose date',
  timeLabel = 'Time',
  minDate,
  minTime,
}: DateTimeFieldProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const display = formatDisplay(date);
  const parts = toParts(time);

  function setPart(part: keyof TimeParts, value: string) {
    onTimeChange(fromParts({ ...parts, [part]: value }));
  }

  // Only the day the two dates match puts the clock in play at all - once
  // the end date is a day later, every hour of it is fair game.
  const restrictTime = Boolean(minTime && minDate && date === minDate);

  /** Fills in whichever of the other two segments the admin hasn't chosen
   * yet with the latest value it could possibly take (11, 59, PM - the
   * 12-hour clock's own quirk means "11 PM" outruns "12 PM"), so a segment
   * is only ever disabled once every remaining way of completing the time
   * would still land at or before the start - never just because a sibling
   * segment happens to be blank still. */
  function favorableParts(base: TimeParts): TimeParts {
    return {
      hour: base.hour || '11',
      minute: base.minute || '59',
      period: base.period || 'PM',
    };
  }

  function isTimeDisabled(part: keyof TimeParts, optionValue: string): boolean {
    if (!restrictTime || !minTime) return false;
    const candidate = fromParts(
      favorableParts({ ...parts, [part]: optionValue }),
    );
    return candidate <= minTime;
  }

  const shell = cn(
    'bg-surface flex h-11 items-center gap-2 rounded-lg px-3 text-sm ring-1',
    'transition-[box-shadow,background-color] duration-150',
    disabled && 'bg-surface-sunken cursor-not-allowed',
    invalid
      ? 'ring-danger focus-within:ring-danger'
      : 'ring-hairline hover:ring-ink-subtle/40 focus-within:ring-accent',
    'focus-within:ring-2',
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <Popover.Root open={dateOpen} onOpenChange={setDateOpen}>
        <Popover.Trigger
          id={id}
          type="button"
          disabled={disabled}
          aria-label={dateLabel}
          aria-invalid={invalid || undefined}
          className={cn(shell, 'w-full focus:outline-none')}
        >
          <CalendarIcon
            className="text-ink-subtle size-4 shrink-0"
            aria-hidden
          />
          <span
            className={cn('truncate', display ? 'text-ink' : 'text-ink-subtle')}
          >
            {display ?? dateLabel}
          </span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="border-hairline bg-surface-raised data-[state=open]:animate-fade-in z-50 rounded-xl border shadow-lg"
          >
            <Calendar
              value={date}
              minDate={minDate}
              onSelect={(next) => {
                onDateChange(next);
                setDateOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* One shell, matching the date field beside it - the three segments
          inside are what is clickable, not the box itself. */}
      <div className={shell} aria-invalid={invalid || undefined}>
        <Clock className="text-ink-subtle size-4 shrink-0" aria-hidden />
        <TimeSegment
          value={parts.hour}
          options={HOUR_OPTIONS}
          numeric
          widthClassName="w-7"
          placeholder="--"
          onChange={(hour) => setPart('hour', hour)}
          disabled={disabled}
          isOptionDisabled={(v) => isTimeDisabled('hour', v)}
          aria-label={`${timeLabel} - hour`}
        />
        <span className="text-ink-subtle" aria-hidden>
          :
        </span>
        <TimeSegment
          value={parts.minute}
          options={MINUTE_OPTIONS}
          numeric
          widthClassName="w-7"
          placeholder="--"
          onChange={(minute) => setPart('minute', minute)}
          disabled={disabled}
          isOptionDisabled={(v) => isTimeDisabled('minute', v)}
          aria-label={`${timeLabel} - minute`}
        />
        <TimeSegment
          value={parts.period}
          options={PERIOD_OPTIONS}
          widthClassName="w-9"
          placeholder="--"
          onChange={(period) => setPart('period', period)}
          disabled={disabled}
          isOptionDisabled={(v) => isTimeDisabled('period', v)}
          aria-label={`${timeLabel} - AM or PM`}
        />
      </div>
    </div>
  );
}
