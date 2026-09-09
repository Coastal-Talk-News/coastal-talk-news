import { cn } from '@coastal-talk-news/ui/cn';
import type { ReactNode } from 'react';

// Always rendered and animated by width — an element removed from the DOM
// cannot transition.
export function SidebarLabel({
  collapsed,
  className,
  children,
}: {
  collapsed: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'overflow-hidden whitespace-nowrap',
        'transition-[max-width,opacity] duration-200 ease-out-soft',
        collapsed ? 'max-w-0 opacity-0' : 'max-w-44 opacity-100 delay-75',
        className,
      )}
    >
      {children}
    </span>
  );
}
