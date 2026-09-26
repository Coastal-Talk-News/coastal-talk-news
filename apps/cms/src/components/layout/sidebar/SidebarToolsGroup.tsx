import { cn } from '@coastal-talk-news/ui/cn';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { ChevronDown, Keyboard, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { sidebarRow } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';
import { SidebarThemeControl } from './SidebarThemeControl.js';

interface SidebarToolsGroupProps {
  collapsed: boolean;
  onShowShortcuts?: () => void;
}

/**
 * Theme and shortcuts fold under one row so the footer takes a single line
 * when they aren't needed. A collapsed sidebar has no room for a heading, so
 * it lists them directly, one icon each.
 */
export function SidebarToolsGroup({
  collapsed,
  onShowShortcuts,
}: SidebarToolsGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const shortcuts = onShowShortcuts && (
    <Tooltip label="Keyboard shortcuts  ·  ?" side="right">
      <button
        type="button"
        onClick={onShowShortcuts}
        aria-label="Keyboard shortcuts"
        className={sidebarRow(
          collapsed,
          'text-ink-subtle hover:bg-surface-sunken hover:text-ink-muted',
        )}
      >
        <Keyboard className="size-5 shrink-0" aria-hidden />
        <SidebarLabel collapsed={collapsed}>Shortcuts</SidebarLabel>
      </button>
    </Tooltip>
  );

  if (collapsed) {
    return (
      <>
        <SidebarThemeControl collapsed />
        {shortcuts}
      </>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className={sidebarRow(
          false,
          'text-ink-muted hover:bg-surface-sunken hover:text-ink',
        )}
      >
        <SlidersHorizontal className="size-5 shrink-0" aria-hidden />
        <SidebarLabel collapsed={false}>Preferences</SidebarLabel>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="border-hairline mt-1 ml-5 space-y-1 border-l pl-3">
          <SidebarThemeControl collapsed={false} />
          {shortcuts}
        </div>
      )}
    </div>
  );
}
