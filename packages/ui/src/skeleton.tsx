import { cn } from './cn.js';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('bg-surface-sunken animate-pulse rounded-md', className)}
    />
  );
}
