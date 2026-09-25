import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/** The explanatory strip at the top of each settings tab. */
export function SettingsNote({ children }: { children: ReactNode }) {
  return (
    <div className="bg-accent-soft flex gap-3 rounded-lg p-4">
      <Info className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="text-ink-muted text-sm">{children}</p>
    </div>
  );
}
