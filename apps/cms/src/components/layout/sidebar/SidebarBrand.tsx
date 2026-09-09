import { cn } from '@coastal-talk-news/ui/cn';
import { SIDEBAR_GUTTER } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn('flex h-16 shrink-0 items-center gap-3', SIDEBAR_GUTTER)}
    >
      <span className="bg-accent text-accent-fg grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold">
        C
      </span>
      <SidebarLabel
        collapsed={collapsed}
        className="text-ink text-[15px] font-bold tracking-tight"
      >
        Coastal Talk<span className="text-accent-text"> News</span>
      </SidebarLabel>
    </div>
  );
}
