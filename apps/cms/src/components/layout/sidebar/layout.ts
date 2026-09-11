import { cn } from '@coastal-talk-news/ui/cn';

export const SIDEBAR_GUTTER = 'px-3';

export function sidebarRow(collapsed: boolean, className?: string): string {
  return cn(
    'flex h-10 w-full items-center rounded-xl text-sm font-medium',
    'transition-colors duration-150',
    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
    className,
  );
}
