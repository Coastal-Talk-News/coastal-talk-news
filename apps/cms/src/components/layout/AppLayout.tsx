import { Drawer } from '@coastal-talk-news/ui/drawer';
import { LoadingState } from '@coastal-talk-news/ui/states';
import { TooltipProvider } from '@coastal-talk-news/ui/tooltip';
import { Menu } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLocalStorage } from '../../lib/useLocalStorage.js';
import { Sidebar } from './sidebar/Sidebar.js';

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useLocalStorage(
    'ctn-sidebar-collapsed',
    false,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Ctrl/Cmd+B matches the editor convention most people already know.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'b' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setCollapsed(!collapsed);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [collapsed, setCollapsed]);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="bg-canvas flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed(!collapsed)}
          />
        </aside>

        {/* Portalled, so the scrim always covers the whole viewport and body
            scroll is locked while it is open. */}
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title="Navigation"
        >
          <Sidebar
            collapsed={false}
            onToggleCollapsed={() => undefined}
            onNavigate={() => setDrawerOpen(false)}
            showCollapseControl={false}
          />
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-hairline bg-surface/85 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="text-ink-muted hover:bg-surface-sunken rounded-lg p-2 transition-colors"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <span className="text-ink text-sm font-bold tracking-tight">
              Coastal Talk<span className="text-accent-text"> News</span>
            </span>
          </header>

          <main
            key={location.pathname}
            className="animate-rise mx-auto w-full max-w-[84rem] px-4 py-6 lg:px-8 lg:py-8"
          >
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
