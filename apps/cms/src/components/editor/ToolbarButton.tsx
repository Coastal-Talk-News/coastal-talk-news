import { cn } from '@coastal-talk-news/ui/cn';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import type { ReactNode } from 'react';

/** Ctrl on Windows and Linux, ⌘ on a Mac — the editor binds both. */
export const MOD =
  typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.platform)
    ? '⌘'
    : 'Ctrl';

export function ToolbarButton({
  active,
  disabled,
  label,
  shortcut,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  shortcut?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip
      label={
        <span className="flex items-center gap-2">
          {label}
          {shortcut && (
            <span className="text-ink-subtle font-normal">{shortcut}</span>
          )}
        </span>
      }
    >
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'grid size-8 place-items-center rounded-md transition-colors',
          'disabled:pointer-events-none disabled:opacity-40',
          active
            ? 'bg-accent-soft text-accent-text'
            : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function Divider() {
  return <span className="bg-hairline mx-1 h-5 w-px" aria-hidden />;
}
