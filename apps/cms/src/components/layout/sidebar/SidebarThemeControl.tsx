import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import type { ThemePreference } from '../../../features/theme/ThemeProvider.js';
import { useTheme } from '../../../features/theme/useTheme.js';
import { sidebarRow } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function SidebarThemeControl({ collapsed }: { collapsed: boolean }) {
  const { preference, setPreference } = useTheme();
  const active =
    OPTIONS.find((option) => option.value === preference) ?? OPTIONS[2];
  const ActiveIcon = active.icon;

  const trigger = (
    <DropdownMenu.Trigger
      aria-label={`Theme: ${active.label}`}
      className={sidebarRow(
        collapsed,
        'text-ink-muted hover:bg-surface-sunken hover:text-ink',
      )}
    >
      <ActiveIcon className="size-5 shrink-0" aria-hidden />
      <SidebarLabel collapsed={collapsed}>{active.label}</SidebarLabel>
    </DropdownMenu.Trigger>
  );

  return (
    <DropdownMenu.Root>
      {collapsed ? (
        <Tooltip label={`Theme: ${active.label}`} side="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="end"
          sideOffset={10}
          className="border-hairline bg-surface-raised data-[state=open]:animate-rise z-50 w-40 rounded-xl border p-1 shadow-lg"
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={value}
              onSelect={() => setPreference(value)}
              className="text-ink-muted data-[highlighted]:bg-surface-sunken data-[highlighted]:text-ink flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {preference === value && (
                <Check
                  className="text-accent-text size-4 shrink-0"
                  aria-hidden
                />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
