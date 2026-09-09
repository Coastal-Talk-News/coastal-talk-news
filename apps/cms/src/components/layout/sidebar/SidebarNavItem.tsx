import { cn } from '@coastal-talk-news/ui/cn';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { NavLink, useMatch, useResolvedPath } from 'react-router-dom';
import { SIDEBAR_GUTTER, sidebarRow } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';
import type { NavItem } from './navigation.js';

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNavItem({
  item,
  collapsed,
  onNavigate,
}: SidebarNavItemProps) {
  const { to, label, icon: Icon, end } = item;
  const resolved = useResolvedPath(to);
  const isActive = Boolean(
    useMatch({ path: resolved.pathname, end: end ?? false }),
  );

  // className must be a string, not NavLink's function form: Radix's asChild
  // Slot merges className by joining, so a function is stringified into the
  // class list and the element renders unstyled.
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={sidebarRow(
        collapsed,
        isActive
          ? collapsed
            ? 'bg-accent text-accent-fg'
            : 'bg-accent-soft text-accent-text'
          : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <SidebarLabel collapsed={collapsed}>{label}</SidebarLabel>
    </NavLink>
  );

  return (
    <li className={cn('relative', SIDEBAR_GUTTER)}>
      {!collapsed && (
        <span
          aria-hidden
          className={cn(
            'bg-accent pointer-events-none absolute top-1/2 left-0 h-5 w-0.75 -translate-y-1/2 rounded-r-full',
            'origin-left transition-transform duration-200',
            isActive ? 'scale-x-100' : 'scale-x-0',
          )}
        />
      )}
      {collapsed ? (
        <Tooltip label={label} side="right">
          {link}
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}
