import { Activity, Cloud, Gauge } from 'lucide-react';
import { cn } from '@coastal-talk-news/ui/cn';
import { useTheme } from '../theme/useTheme.js';

type Meter = { used: number; limit: number; warnAt: number } | null;

interface CloudflareUsageCardProps {
  requests: Meter;
  events: Meter;
  pending?: boolean;
}

const formatAmount = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

function Row({
  label,
  icon: Icon,
  usage,
  pending,
  isClassic,
}: {
  label: string;
  icon: typeof Gauge;
  usage: Meter;
  pending: boolean;
  isClassic: boolean;
}) {
  const percent = usage
    ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
    : 0;
  const isHigh = usage !== null && usage.used >= usage.warnAt;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </span>
        {usage && (
          <span
            className={cn(
              'shrink-0 text-xs font-semibold tabular-nums',
              isHigh ? 'text-danger-text' : 'text-ink-subtle',
            )}
          >
            {percent}%
          </span>
        )}
      </div>
      <p className="mt-0.5 text-lg font-bold tracking-tight text-ink">
        {usage ? (
          <>
            {formatAmount(usage.used)}
            <span className="text-xs font-medium text-ink-muted">
              {' '}
              / {usage.limit}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-ink-muted">
            {pending ? 'Loading…' : 'Unavailable'}
          </span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={usage?.limit ?? 0}
        aria-valuenow={usage?.used ?? 0}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isHigh ? 'bg-danger' : isClassic ? 'bg-emerald-500' : 'bg-accent',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Both figures come from the same CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN
 * and reset together at UTC midnight, so they share one card - two separate
 * ones would read as unrelated meters rather than the one Cloudflare Workers
 * usage picture they actually are.
 */
export function CloudflareUsageCard({
  requests,
  events,
  pending = false,
}: CloudflareUsageCardProps) {
  const { palette } = useTheme();
  const isClassic = palette === 'classic';

  return (
    <div className="border-hairline rounded-card border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            isClassic
              ? 'bg-blue-50 text-blue-600'
              : 'bg-accent-soft text-accent-text',
          )}
        >
          <Cloud className="size-4" aria-hidden />
        </span>
        <span className="text-sm text-ink-muted">Cloudflare Workers</span>
      </div>
      <div className="mt-4 space-y-4">
        <Row
          label="Requests today"
          icon={Gauge}
          usage={requests}
          pending={pending}
          isClassic={isClassic}
        />
        <Row
          label="Observability events today"
          icon={Activity}
          usage={events}
          pending={pending}
          isClassic={isClassic}
        />
      </div>
    </div>
  );
}
