import type {
  AnalyticsDailyViewsDto,
  AnalyticsMonthlyViewsDto,
  AnalyticsWeeklyViewsDto,
} from '@coastal-talk-news/types';
import { Select } from '@coastal-talk-news/ui/select';
import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { analyticsApi } from '../../api/analytics.js';
import { queryKeys } from '../../api/queryKeys.js';
import { formatDate } from '../../lib/format.js';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface DetailTableProps<T> {
  /** What the left column holds — "Day", "Week" or "Month" — so the header
   * matches whichever breakdown is actually showing. */
  columnLabel: string;
  rows: T[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  renderRow: (row: T, index: number) => { label: string; views: number };
  total: number;
}

function DetailTable<T>({
  columnLabel,
  rows,
  isPending,
  isError,
  onRetry,
  renderRow,
  total,
}: DetailTableProps<T>) {
  if (isPending) return <LoadingState label="Loading…" />;
  if (isError) {
    return (
      <ErrorState message="Could not load this breakdown." onRetry={onRetry} />
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-ink-subtle border-hairline border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
          <th className="py-2 pr-4">{columnLabel}</th>
          <th className="py-2 text-right">Views</th>
        </tr>
      </thead>
      <tbody className="divide-hairline divide-y">
        {(rows ?? []).map((row, index) => {
          const { label, views } = renderRow(row, index);
          return (
            <tr key={index}>
              <td className="text-ink py-2.5 pr-4">{label}</td>
              <td className="text-ink py-2.5 text-right font-semibold tabular-nums">
                {views}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-hairline border-t">
          <td className="text-ink-muted py-2.5 pr-4 font-medium">Total</td>
          <td className="text-ink py-2.5 text-right font-bold tabular-nums">
            {total}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function DailyDetail() {
  const query = useQuery({
    queryKey: queryKeys.analyticsDailyViews,
    queryFn: ({ signal }) => analyticsApi.dailyViews(signal),
  });
  const total = (query.data ?? []).reduce((sum, row) => sum + row.views, 0);

  return (
    <DetailTable<AnalyticsDailyViewsDto>
      columnLabel="Day"
      rows={query.data}
      isPending={query.isPending}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      total={total}
      renderRow={(row) => ({ label: formatDate(row.date), views: row.views })}
    />
  );
}

function WeeklyDetail() {
  const query = useQuery({
    queryKey: queryKeys.analyticsWeeklyViews,
    queryFn: ({ signal }) => analyticsApi.weeklyViews(signal),
  });
  const total = (query.data ?? []).reduce((sum, row) => sum + row.views, 0);

  return (
    <DetailTable<AnalyticsWeeklyViewsDto>
      columnLabel="Week"
      rows={query.data}
      isPending={query.isPending}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      total={total}
      renderRow={(row) => ({
        label: `${formatDate(row.from)} – ${formatDate(row.to)}`,
        views: row.views,
      })}
    />
  );
}

function MonthlyDetail() {
  const years = useQuery({
    queryKey: queryKeys.analyticsYearRange,
    queryFn: ({ signal }) => analyticsApi.yearRange(signal),
  });
  const [year, setYear] = useState<number | null>(null);
  const selectedYear = year ?? years.data?.maxYear ?? null;

  const months = useQuery({
    queryKey: queryKeys.analyticsMonthlyViews(selectedYear ?? 0),
    queryFn: ({ signal }) =>
      analyticsApi.monthlyViews(selectedYear as number, signal),
    enabled: selectedYear !== null,
  });
  const total = (months.data ?? []).reduce((sum, row) => sum + row.views, 0);

  if (years.isPending) return <LoadingState label="Loading…" />;
  if (years.isError || selectedYear === null) {
    return (
      <ErrorState
        message="Could not load the year range."
        onRetry={() => void years.refetch()}
      />
    );
  }

  const yearOptions = Array.from(
    { length: years.data.maxYear - years.data.minYear + 1 },
    (_, i) => years.data.maxYear - i,
  ).map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink-muted text-sm font-medium">Year</span>
        <Select
          value={String(selectedYear)}
          onValueChange={(value) => setYear(Number(value))}
          options={yearOptions}
          size="sm"
          aria-label="Year"
        />
      </div>
      <DetailTable<AnalyticsMonthlyViewsDto>
        columnLabel="Month"
        rows={months.data}
        isPending={months.isPending}
        isError={months.isError}
        onRetry={() => void months.refetch()}
        total={total}
        renderRow={(row) => ({
          label: MONTH_NAMES[row.month - 1] ?? String(row.month),
          views: row.views,
        })}
      />
    </div>
  );
}

export type ViewsDetailKind = 'week' | 'month' | 'year' | null;

const SHEET_CONTENT: Record<
  Exclude<ViewsDetailKind, null>,
  { title: string; description: string }
> = {
  week: {
    title: 'Views by Day',
    description: 'Reads for each of the last 7 days.',
  },
  month: {
    title: 'Views by Week',
    description:
      'Reads for each 7-day span of the last 30 days, most recent first.',
  },
  year: {
    title: 'Views by Month',
    description: 'Reads for each calendar month of the chosen year.',
  },
};

export function ViewsDetailSheet({
  kind,
  onClose,
}: {
  kind: ViewsDetailKind;
  onClose: () => void;
}) {
  const content = kind ? SHEET_CONTENT[kind] : null;

  return (
    <Sheet
      open={kind !== null}
      onOpenChange={(open) => !open && onClose()}
      title={content?.title ?? ''}
      description={content?.description}
    >
      {kind === 'week' && <DailyDetail />}
      {kind === 'month' && <WeeklyDetail />}
      {kind === 'year' && <MonthlyDetail />}
    </Sheet>
  );
}
