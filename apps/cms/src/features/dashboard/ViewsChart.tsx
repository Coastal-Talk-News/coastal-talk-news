import { cn } from '@coastal-talk-news/ui/cn';
import { useTheme } from '../theme/useTheme.js';

export interface ViewsChartDatum {
  label: string;
  views: number;
  /** Shown on hover - a fuller description than the label has room for
   *  (e.g. the full date range a "week" bar covers). */
  title?: string;
  /** Whether this bar is the one "now" actually falls in - the caller
   *  decides this from real dates, not just "the last bar", since a full
   *  calendar year's last bar is December even in January, or while looking
   *  at a past year where no bar is current at all. */
  isCurrent?: boolean;
}

interface ViewsChartProps {
  data: ViewsChartDatum[];
}

const CHART_HEIGHT = 'h-40';

/** A plain bar chart, not a charting library - this app has no other chart
 *  anywhere, and these are a handful of bars at most (12 months, or a
 *  month's worth of weeks), which plain CSS draws perfectly well.
 *
 * Every bar always shows its number, not just on hover - a sliver of colour
 * for "2 views" means nothing on its own without the figure next to it, and
 * a non-technical reader isn't going to discover a hover tooltip. A scale
 * on the left and two guide lines give the bars something to be read
 * against, and the most recent bar is filled solid so it's obvious which
 * one "now" is in a run of history.
 */
export function ViewsChart({ data }: ViewsChartProps) {
  const { palette } = useTheme();
  // Classic keeps its original literal blue bars, independent of any
  // accent; every other theme uses one consistent accent instead.
  const isClassic = palette === 'classic';

  if (data.length === 0) {
    return (
      <p className="text-ink-subtle py-8 text-center text-sm">
        No reads recorded for this period yet.
      </p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.views));
  const mid = Math.round(max / 2);

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          CHART_HEIGHT,
          'flex flex-col justify-between text-right text-[10px] text-ink-subtle tabular-nums',
        )}
      >
        <span>{max.toLocaleString()}</span>
        <span>{mid.toLocaleString()}</span>
        <span>0</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn(CHART_HEIGHT, 'relative')}>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-hairline border-t" />
            <div className="border-hairline border-t border-dashed" />
            <div className="border-hairline border-t" />
          </div>

          <div className="relative flex h-full items-end gap-1 sm:gap-1.5">
            {data.map((d, index) => {
              const heightPercent = Math.max(
                2,
                Math.round((d.views / max) * 100),
              );
              return (
                <div
                  key={index}
                  title={
                    d.title ?? `${d.label}: ${d.views.toLocaleString()} views`
                  }
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <span
                    className={cn(
                      'mb-1 text-[11px] font-semibold tabular-nums',
                      d.isCurrent ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {d.views.toLocaleString()}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-colors',
                      isClassic
                        ? d.isCurrent
                          ? 'bg-blue-500'
                          : 'bg-blue-500/45 hover:bg-blue-500/70'
                        : d.isCurrent
                          ? 'bg-accent'
                          : 'bg-accent/45 hover:bg-accent/70',
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-1.5 flex gap-1 sm:gap-1.5">
          {data.map((d, index) => (
            <span
              key={index}
              className={cn(
                'min-w-0 flex-1 truncate text-center text-[10px]',
                d.isCurrent ? 'font-semibold text-ink' : 'text-ink-subtle',
              )}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
