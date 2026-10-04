import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@coastal-talk-news/ui/cn';
import { useTheme } from '../theme/useTheme.js';

export type StatTone = 'blue' | 'green' | 'amber' | 'slate' | 'red' | 'violet';

/** The exact per-card colours this app originally shipped with, kept only
 *  for the Classic theme - literal hues, independent of any accent. Every
 *  other theme ignores `tone` and uses one consistent accent instead (see
 *  below): a row of several different hues reads as a template dashboard
 *  rather than production software, but Classic is specifically the "keep
 *  it exactly as it was" option, icons included. */
const CLASSIC_TONES: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-surface-sunken text-ink-muted',
  red: 'bg-danger-soft text-danger-text',
  violet: 'bg-violet-50 text-violet-600',
};

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: StatTone;
  /** Without a destination or a click handler, the card is a plain figure. */
  to?: string;
  onClick?: () => void;
  caption?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  to,
  onClick,
  caption,
}: StatCardProps) {
  const { palette } = useTheme();
  const chipClass =
    palette === 'classic'
      ? CLASSIC_TONES[tone]
      : 'bg-accent-soft text-accent-text';

  const body = (
    <>
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl',
          chipClass,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-bold tracking-tight text-ink">
          {value}
        </span>
        <span className="block truncate text-sm text-ink-muted">{label}</span>
        {caption && (
          <span className="block text-xs text-ink-subtle">{caption}</span>
        )}
      </span>
      {(to || onClick) && (
        <ChevronRight
          className="size-4 shrink-0 text-ink-subtle transition group-hover:text-ink"
          aria-hidden
        />
      )}
    </>
  );

  const cardClass =
    'group flex items-center gap-4 border-hairline rounded-card border bg-surface p-5 shadow-sm';

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          cardClass,
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        )}
      >
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          cardClass,
          'text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={cardClass}>{body}</div>;
}
