import { cn } from '@coastal-talk-news/ui/cn';
import { useSiteBrand } from '../../../features/branding/useSiteBrand.js';
import { SIDEBAR_GUTTER } from './layout.js';
import { SidebarLabel } from './SidebarLabel.js';

/** Only shown when no logo is configured yet - the logo itself works fine
 *  at the collapsed rail's width (it's already roughly square/circular). */
function BrandMark() {
  return (
    <span className="bg-accent text-accent-fg grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold">
      C
    </span>
  );
}

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  const settings = useSiteBrand();
  const logo = settings?.logo;

  return (
    <div
      className={cn('flex shrink-0 items-center gap-2.5 py-3', SIDEBAR_GUTTER)}
    >
      {logo ? (
        <img
          src={logo.url}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <BrandMark />
      )}
      <SidebarLabel collapsed={collapsed} className="flex min-w-0 flex-col">
        <span className="font-article text-ink block text-[16px] font-bold tracking-tight uppercase">
          {settings?.siteName ?? 'Coastal Talk News'}
        </span>
        {settings?.tagline && (
          <span className="text-ink-subtle block text-[9px] leading-tight tracking-tight">
            {settings.tagline}
          </span>
        )}
      </SidebarLabel>
    </div>
  );
}
