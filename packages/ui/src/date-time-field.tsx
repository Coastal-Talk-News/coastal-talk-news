import * as Popover from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useState } from 'react';
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
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const display = formatDisplay(date);

  const shell = cn(
    'bg-surface flex h-11 items-center gap-2 rounded-lg px-3 text-sm ring-1',
    'transition-[box-shadow,background-color] duration-150',
    'disabled:bg-surface-sunken disabled:cursor-not-allowed',
    invalid
      ? 'ring-danger focus-within:ring-danger'
      : 'ring-hairline hover:ring-ink-subtle/40 focus-within:ring-accent',
    'focus-within:ring-2',
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <Popover.Root open={open} onOpenChange={setOpen}>
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
              onSelect={(next) => {
                onDateChange(next);
                setOpen(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div className={shell}>
        <Clock className="text-ink-subtle size-4 shrink-0" aria-hidden />
        <input
          type="time"
          value={time}
          disabled={disabled}
          aria-label={timeLabel}
          onChange={(event) => onTimeChange(event.target.value)}
          className="text-ink w-full bg-transparent focus:outline-none disabled:text-ink-subtle"
        />
      </div>
    </div>
  );
}
