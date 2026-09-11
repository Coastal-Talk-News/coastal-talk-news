import { CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';

const weekdayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'long' });

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const clockFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const TICK_MS = 30_000;

export function DashboardDate() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="border-hairline bg-surface flex items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm">
      <span className="bg-accent-soft text-accent-text grid size-9 shrink-0 place-items-center rounded-lg">
        <CalendarDays className="size-4.5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-ink text-sm font-semibold">
          {weekdayFormatter.format(now)}
        </p>
        <p className="text-ink-muted mt-0.5 text-xs">
          {dateFormatter.format(now)}
          <span className="text-ink-subtle"> · </span>
          <time className="tabular-nums" dateTime={now.toISOString()}>
            {clockFormatter.format(now)}
          </time>
        </p>
      </div>
    </div>
  );
}
