import type { LucideIcon } from 'lucide-react';
import { cn } from '@coastal-talk-news/ui/cn';

interface UsageMeterProps {
  label: string;
  icon: LucideIcon;
  /** Null while the figure could not be read. */
  usage: { used: number; limit: number; warnAt: number } | null;
  unit: string;
  pending?: boolean;
}

const formatAmount = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

export function UsageMeter({
  label,
  icon: Icon,
  usage,
  unit,
  pending = false,
}: UsageMeterProps) {
  const percent = usage
    ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
    : 0;
  const isHigh = usage !== null && usage.used >= usage.warnAt;

  return (
    <div className="border-hairline rounded-card border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-xl',
            isHigh
              ? 'bg-danger-soft text-danger-text'
              : 'bg-blue-50 text-blue-600',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink-muted">{label}</span>
          <span className="block text-2xl font-bold tracking-tight text-ink">
            {usage ? (
              <>
                {formatAmount(usage.used)}
                <span className="text-sm font-medium text-ink-muted">
                  {' '}
                  / {usage.limit} {unit}
                </span>
              </>
            ) : (
              <span className="text-base font-medium text-ink-muted">
                {pending ? 'Loading…' : 'Unavailable'}
              </span>
            )}
          </span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={usage?.limit ?? 0}
        aria-valuenow={usage?.used ?? 0}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isHigh ? 'bg-danger' : 'bg-emerald-500',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
