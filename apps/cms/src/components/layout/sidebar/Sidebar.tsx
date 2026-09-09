import { cn } from '@coastal-talk-news/ui/cn';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SIDEBAR_GUTTER, sidebarRow } from './layout.js';
import { NAV_GROUPS } from './navigation.js';
import { SidebarAccount } from './SidebarAccount.js';
import { SidebarBrand } from './SidebarBrand.js';
import { SidebarLabel } from './SidebarLabel.js';
import { SidebarNavItem } from './SidebarNavItem.js';
import { SidebarThemeControl } from './SidebarThemeControl.js';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
  /** Hidden in the mobile drawer, where collapsing is meaningless. */
  showCollapseControl?: boolean;
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  showCollapseControl = true,
}: SidebarProps) {
  return (
    <div
      className={cn(
        'border-hairline bg-surface flex h-full flex-col border-r',
        'transition-[width] duration-300 ease-out-soft',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <SidebarBrand collapsed={collapsed} />

      <nav
        aria-label="Main"
        className="no-scrollbar flex-1 space-y-4 overflow-x-hidden overflow-y-auto py-2"
      >
        {NAV_GROUPS.map((group, index) => (
          <div key={group.heading ?? `group-${index}`}>
            {group.heading &&
              (collapsed ? (
                <div className={cn('mb-2', SIDEBAR_GUTTER)} aria-hidden>
                  <div className="bg-hairline h-px" />
                </div>
              ) : (
                <p className="text-ink-subtle mb-1.5 px-6 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {group.heading}
                </p>
              ))}

            <ul className="space-y-1">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          'border-hairline space-y-1 border-t py-3',
          SIDEBAR_GUTTER,
        )}
      >
        <SidebarThemeControl collapsed={collapsed} />
        <SidebarAccount collapsed={collapsed} />

        {showCollapseControl && (
          <Tooltip
            label={`${collapsed ? 'Expand' : 'Collapse'} sidebar  ·  Ctrl B`}
            side="right"
          >
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={collapsed}
              className={sidebarRow(
                collapsed,
                'text-ink-subtle hover:bg-surface-sunken hover:text-ink-muted',
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-5 shrink-0" aria-hidden />
              ) : (
                <PanelLeftClose className="size-5 shrink-0" aria-hidden />
              )}
              <SidebarLabel collapsed={collapsed}>Collapse</SidebarLabel>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
