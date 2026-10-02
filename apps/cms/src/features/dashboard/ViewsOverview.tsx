import { cn } from '@coastal-talk-news/ui/cn';
import { IconButton } from '@coastal-talk-news/ui/icon-button';
import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { analyticsApi } from '../../api/analytics.js';
import { queryKeys } from '../../api/queryKeys.js';
import { ViewsChart, type ViewsChartDatum } from './ViewsChart.js';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const dayLabel = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});
const fullDate = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const monthNameLong = new Intl.DateTimeFormat('en-IN', { month: 'long' });

type Period = 'today' | 'week' | 'month' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

function sum(rows: { views: number }[] | undefined): number {
  return (rows ?? []).reduce((total, row) => total + row.views, 0);
}

/** The Monday on or before this date - matches the API's week boundary. */
function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** A single comparable number for a (year, month) pair, so "is this month
 *  before/after that one" is a plain subtraction. */
function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

interface MonthCursor {
  year: number;
  month: number;
}

interface ViewsOverviewProps {
  /** Already loaded by the page; "Today" has nothing to navigate to, so it
   *  needs no query of its own. */
  viewsToday: number;
}

/**
 * One place to look at reads instead of four stat cards plus three
 * drill-down panels for what is fundamentally the same figure at a
 * different zoom level - with Previous/Next navigation on Week, Month and
 * Year, so a past period is one click away instead of unreachable. The
 * headline total always matches the chart below it exactly, because both
 * come from the same data.
 */
export function ViewsOverview({ viewsToday }: ViewsOverviewProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [weeksAgo, setWeeksAgo] = useState(0);
  const now = new Date();
  const [monthCursor, setMonthCursor] = useState<MonthCursor>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [yearCursor, setYearCursor] = useState(now.getFullYear());

  // Needed on every period, not just Year, to grey out "Previous" once Week
  // or Month would go back further than there is any real data.
  const bounds = useQuery({
    queryKey: queryKeys.analyticsYearRange,
    queryFn: ({ signal }) => analyticsApi.yearRange(signal),
  });

  const week = useQuery({
    queryKey: queryKeys.analyticsWeekViews(weeksAgo),
    queryFn: ({ signal }) => analyticsApi.weekViews(weeksAgo, signal),
    enabled: period === 'week',
  });
  const month = useQuery({
    queryKey: queryKeys.analyticsMonthViews(
      monthCursor.year,
      monthCursor.month,
    ),
    queryFn: ({ signal }) =>
      analyticsApi.monthViews(monthCursor.year, monthCursor.month, signal),
    enabled: period === 'month',
  });
  const yearly = useQuery({
    queryKey: queryKeys.analyticsMonthlyViews(yearCursor),
    queryFn: ({ signal }) => analyticsApi.monthlyViews(yearCursor, signal),
    enabled: period === 'year',
  });

  const isPending =
    (period === 'week' && week.isPending) ||
    (period === 'month' && month.isPending) ||
    (period === 'year' && yearly.isPending);
  const isError =
    (period === 'week' && week.isError) ||
    (period === 'month' && month.isError) ||
    (period === 'year' && yearly.isError);
  const retry = () => {
    if (period === 'week') void week.refetch();
    else if (period === 'month') void month.refetch();
    else if (period === 'year') void yearly.refetch();
  };

  const todayKey = now.toDateString();
  const earliestDate = bounds.data?.earliestDate
    ? new Date(bounds.data.earliestDate)
    : null;

  // --- Week navigation ---
  const viewedWeekStart = addDays(startOfWeek(now), -7 * weeksAgo);
  const viewedWeekEnd = weeksAgo === 0 ? now : addDays(viewedWeekStart, 6);
  const weekLabel = `${fullDate.format(viewedWeekStart)} – ${fullDate.format(viewedWeekEnd)}`;
  const weekNextDisabled = weeksAgo <= 0;
  const weekPrevDisabled = earliestDate
    ? viewedWeekStart <= startOfWeek(earliestDate)
    : true;

  // --- Month navigation ---
  const currentMonth: MonthCursor = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
  const earliestMonth: MonthCursor | null = earliestDate
    ? { year: earliestDate.getFullYear(), month: earliestDate.getMonth() + 1 }
    : null;
  const isCurrentMonth =
    monthIndex(monthCursor.year, monthCursor.month) ===
    monthIndex(currentMonth.year, currentMonth.month);
  const monthLabel = `${monthNameLong.format(new Date(monthCursor.year, monthCursor.month - 1, 1))} ${monthCursor.year}`;
  const monthNextDisabled = isCurrentMonth;
  const monthPrevDisabled = earliestMonth
    ? monthIndex(monthCursor.year, monthCursor.month) <=
      monthIndex(earliestMonth.year, earliestMonth.month)
    : true;

  // --- Year navigation ---
  const yearNextDisabled = bounds.data
    ? yearCursor >= bounds.data.maxYear
    : true;
  const yearPrevDisabled = bounds.data
    ? yearCursor <= bounds.data.minYear
    : true;

  const chartData: ViewsChartDatum[] =
    period === 'week'
      ? (week.data ?? []).map((row) => ({
          label: dayLabel.format(new Date(row.date)),
          title: `${fullDate.format(new Date(row.date))}: ${row.views.toLocaleString()} views`,
          views: row.views,
          isCurrent: new Date(row.date).toDateString() === todayKey,
        }))
      : period === 'month'
        ? // One bar per day - the month is already named above, so each bar
          // just needs its day number, not the month repeated on every one.
          (month.data ?? []).map((row) => ({
            label: String(new Date(row.date).getDate()),
            title: `${fullDate.format(new Date(row.date))}: ${row.views.toLocaleString()} views`,
            views: row.views,
            isCurrent: new Date(row.date).toDateString() === todayKey,
          }))
        : period === 'year'
          ? (yearly.data ?? []).map((row) => ({
              label: MONTH_NAMES[row.month - 1] ?? String(row.month),
              views: row.views,
              isCurrent:
                yearCursor === now.getFullYear() &&
                row.month === now.getMonth() + 1,
            }))
          : [];

  const total =
    period === 'today'
      ? viewsToday
      : period === 'week'
        ? sum(week.data)
        : period === 'month'
          ? sum(month.data)
          : sum(yearly.data);

  const caption =
    period === 'today'
      ? 'Views today'
      : period === 'week'
        ? weeksAgo === 0
          ? 'Views this week, so far'
          : 'Views that week'
        : period === 'month'
          ? isCurrentMonth
            ? `Views so far in ${monthNameLong.format(now)}`
            : `Views in ${monthLabel}`
          : `Views in ${yearCursor}`;

  return (
    <section className="border-hairline rounded-card border bg-surface shadow-sm">
      <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold text-ink">Reader views</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Counted once a reader stays on an article for at least half its read
            time.
          </p>
        </div>
        <div className="border-hairline bg-surface-sunken inline-flex rounded-lg border p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                period === p.key
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="block text-4xl font-bold tracking-tight text-ink">
              {total.toLocaleString()}
            </span>
            <span className="text-sm text-ink-muted">{caption}</span>
          </div>

          {period === 'week' && (
            <div className="flex items-center gap-2">
              <IconButton
                label="Previous week"
                disabled={weekPrevDisabled}
                onClick={() => setWeeksAgo((w) => w + 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </IconButton>
              <span className="min-w-44 text-center text-sm font-medium text-ink">
                {weekLabel}
              </span>
              <IconButton
                label="Next week"
                disabled={weekNextDisabled}
                onClick={() => setWeeksAgo((w) => Math.max(0, w - 1))}
              >
                <ChevronRight className="size-4" aria-hidden />
              </IconButton>
            </div>
          )}

          {period === 'month' && (
            <div className="flex items-center gap-2">
              <IconButton
                label="Previous month"
                disabled={monthPrevDisabled}
                onClick={() =>
                  setMonthCursor((c) =>
                    c.month === 1
                      ? { year: c.year - 1, month: 12 }
                      : { year: c.year, month: c.month - 1 },
                  )
                }
              >
                <ChevronLeft className="size-4" aria-hidden />
              </IconButton>
              <span className="min-w-36 text-center text-sm font-medium text-ink">
                {monthLabel}
              </span>
              <IconButton
                label="Next month"
                disabled={monthNextDisabled}
                onClick={() =>
                  setMonthCursor((c) =>
                    c.month === 12
                      ? { year: c.year + 1, month: 1 }
                      : { year: c.year, month: c.month + 1 },
                  )
                }
              >
                <ChevronRight className="size-4" aria-hidden />
              </IconButton>
            </div>
          )}

          {period === 'year' && (
            <div className="flex items-center gap-2">
              <IconButton
                label="Previous year"
                disabled={yearPrevDisabled}
                onClick={() => setYearCursor((y) => y - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </IconButton>
              <span className="min-w-16 text-center text-sm font-medium text-ink">
                {yearCursor}
              </span>
              <IconButton
                label="Next year"
                disabled={yearNextDisabled}
                onClick={() => setYearCursor((y) => y + 1)}
              >
                <ChevronRight className="size-4" aria-hidden />
              </IconButton>
            </div>
          )}
        </div>

        {period !== 'today' && (
          <div className="mt-6">
            {isError ? (
              <ErrorState message="Could not load views." onRetry={retry} />
            ) : isPending ? (
              <LoadingState label="Loading…" />
            ) : (
              <ViewsChart data={chartData} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
