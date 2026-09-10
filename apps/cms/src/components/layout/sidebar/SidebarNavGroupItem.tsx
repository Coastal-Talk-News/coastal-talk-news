import { cn } from '@coastal-talk-news/ui/cn';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { SIDEBAR_GUTTER, sidebarRow } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';
import type { NavChild, NavItem } from './navigation.js';

interface SidebarNavGroupItemProps {
  item: NavItem & { children: NavChild[] };
  collapsed: boolean;
  onNavigate?: () => void;
}

function isChildActive(child: NavChild, pathname: string): boolean {
  return (
    matchPath({ path: child.to, end: child.end ?? false }, pathname) !== null
  );
}

/**
 * A nav item with sub-links (News: All Articles / Create Article). Expand
 * state defaults from whether a child route is current, then stays under the
 * viewer's control — reopening on every navigation within the group would
 * fight a deliberate collapse.
 */
export function SidebarNavGroupItem({
  item,
  collapsed,
  onNavigate,
}: SidebarNavGroupItemProps) {
  const { label, icon: Icon, children } = item;
  const { pathname } = useLocation();
  const groupActive = children.some((child) => isChildActive(child, pathname));
  const [expanded, setExpanded] = useState(groupActive);

  // Collapsed rail: no flyout submenu, just a link to the group's default
  // route, matching how a collapsed sidebar treats every other item.
  if (collapsed) {
    return (
      <li className={cn('relative', SIDEBAR_GUTTER)}>
        <NavLink
          to={children[0].to}
          onClick={onNavigate}
          className={sidebarRow(
            true,
            groupActive
              ? 'bg-accent text-accent-fg'
              : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
          )}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
        </NavLink>
      </li>
    );
  }

  return (
    <li className={SIDEBAR_GUTTER}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className={sidebarRow(
          false,
          groupActive
            ? 'bg-accent-soft text-accent-text'
            : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        <SidebarLabel collapsed={false}>{label}</SidebarLabel>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <ul className="border-hairline mt-1 ml-5 space-y-0.5 border-l pl-4">
          {children.map((child) => {
            const active = isChildActive(child, pathname);
            return (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  end={child.end}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent-soft text-accent-text'
                      : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                  )}
                >
                  {child.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
