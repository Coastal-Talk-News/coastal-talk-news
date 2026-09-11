import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/useAuth.js';
import { initialsOf } from '../../../lib/format.js';
import { sidebarRow } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';

export function SidebarAccount({ collapsed }: { collapsed: boolean }) {
  const { user, logout, isSigningOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    if (isSigningOut) return;
    try {
      await logout();
      toast.success('Signed out.');
    } catch {
      toast.warning(
        'Signed out here, but your connection dropped. Try again online.',
      );
    }
    navigate('/login', { replace: true });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Account menu"
        className={sidebarRow(collapsed, 'hover:bg-surface-sunken')}
      >
        <span className="bg-accent text-accent-fg grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold">
          {initialsOf(user?.name ?? '')}
        </span>
        <SidebarLabel
          collapsed={collapsed}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span className="min-w-0 flex-1 text-left">
            <span className="text-ink block truncate text-sm font-medium">
              {user?.name}
            </span>
            <span className="text-ink-subtle block truncate text-xs">
              {user?.email}
            </span>
          </span>
          <ChevronDown
            className="text-ink-subtle size-4 shrink-0"
            aria-hidden
          />
        </SidebarLabel>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side={collapsed ? 'right' : 'top'}
          align={collapsed ? 'end' : 'start'}
          sideOffset={10}
          className="border-hairline bg-surface-raised data-[state=open]:animate-rise z-50 w-56 rounded-xl border p-1 shadow-lg"
        >
          {collapsed && (
            <>
              <div className="px-3 py-2">
                <p className="text-ink truncate text-sm font-medium">
                  {user?.name}
                </p>
                <p className="text-ink-subtle truncate text-xs">
                  {user?.email}
                </p>
              </div>
              <DropdownMenu.Separator className="bg-hairline my-1 h-px" />
            </>
          )}
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="text-ink-muted data-[highlighted]:bg-surface-sunken data-[highlighted]:text-ink flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
