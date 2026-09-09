import { cn } from '@coastal-talk-news/ui/cn';

// 64px rail − 12px gutter × 2 = a 40px square. Sizes are explicit: an element
// left to stretch does not, and lands off that axis.
export const SIDEBAR_GUTTER = 'px-3';

export function sidebarRow(collapsed: boolean, className?: string): string {
  return cn(
    'flex h-10 w-full items-center rounded-xl text-sm font-medium',
    'transition-colors duration-150',
    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
    className,
  );
}
