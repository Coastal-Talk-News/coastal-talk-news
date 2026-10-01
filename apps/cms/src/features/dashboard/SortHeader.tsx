import type { SortOrder } from '@coastal-talk-news/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@coastal-talk-news/ui/cn';

interface SortHeaderProps {
  label: string;
  active: boolean;
  order: SortOrder;
  onSort: () => void;
  align?: 'left' | 'right';
}

/** A column heading that sorts the table when clicked. */
export function SortHeader({
  label,
  active,
  order,
  onSort,
  align = 'left',
}: SortHeaderProps) {
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      className={cn('py-3 pr-4', align === 'right' && 'text-right')}
      aria-sort={
        active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex items-center gap-1 uppercase transition-colors hover:text-ink',
          active && 'text-ink',
        )}
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  );
}
