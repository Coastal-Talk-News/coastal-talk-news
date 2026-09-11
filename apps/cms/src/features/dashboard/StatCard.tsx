import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@coastal-talk-news/ui/cn';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber' | 'slate' | 'red' | 'violet';
  to: string;
  caption?: string;
}

const TONES: Record<StatCardProps['tone'], string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-surface-sunken text-ink-muted',
  red: 'bg-danger-soft text-danger-text',
  violet: 'bg-violet-50 text-violet-600',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  to,
  caption,
}: StatCardProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 border-hairline rounded-card border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl',
          TONES[tone],
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
      <ChevronRight
        className="size-4 shrink-0 text-ink-subtle transition group-hover:text-ink"
        aria-hidden
      />
    </Link>
  );
}
