import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from './cn.js';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const monthFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'long',
  year: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromDateValue(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return toDateValue(a) === toDateValue(b);
}

interface CalendarProps {
  value: string;
  onSelect: (value: string) => void;
}

export function Calendar({ value, onSelect }: CalendarProps) {
  const selected = value ? fromDateValue(value) : null;
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );

  const today = new Date();
  const firstDay = startOfMonth(visibleMonth);
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();

  const cells: Array<Date | null> = [
    ...Array.from({ length: firstDay.getDay() }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) =>
        new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth(),
          index + 1,
        ),
    ),
  ];

  function shiftMonth(by: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + by, 1),
    );
  }

  return (
    <div className="w-64 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="text-ink-muted hover:bg-surface-sunken hover:text-ink grid size-7 place-items-center rounded-md transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="text-ink text-sm font-medium">
          {monthFormatter.format(visibleMonth)}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="text-ink-muted hover:bg-surface-sunken hover:text-ink grid size-7 place-items-center rounded-md transition-colors"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((day, index) => (
          <span
            key={index}
            aria-hidden
            className="text-ink-subtle grid h-7 place-items-center text-[11px] font-medium"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, index) =>
          date ? (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(toDateValue(date))}
              aria-label={fullDateFormatter.format(date)}
              aria-current={isSameDay(date, today) ? 'date' : undefined}
              className={cn(
                'grid size-8 place-items-center justify-self-center rounded-md text-sm transition-colors',
                selected && isSameDay(date, selected)
                  ? 'bg-accent text-accent-fg font-medium'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                !selected || !isSameDay(date, selected)
                  ? isSameDay(date, today) && 'text-accent-text font-semibold'
                  : undefined,
              )}
            >
              {date.getDate()}
            </button>
          ) : (
            <span key={index} />
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(toDateValue(new Date()))}
        className="text-accent-text hover:bg-accent-soft mt-2 w-full rounded-md py-1.5 text-xs font-medium transition-colors"
      >
        Today
      </button>
    </div>
  );
}
