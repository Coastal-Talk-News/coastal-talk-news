import { cn } from '@coastal-talk-news/ui/cn';
import { Check, Monitor, Moon, Pipette, Sun } from 'lucide-react';
import type { Palette, ThemePreference } from '../theme/ThemeProvider.js';
import { useTheme } from '../theme/useTheme.js';

/* Same shared neutral (Zinc, ui.shadcn.com's own scale) in every row except
 * Classic, which keeps its own original warm-cream swatches - only the
 * third swatch, the accent, changes between the Zinc-based themes. */
const PALETTES: { value: Palette; label: string; swatches: string[] }[] = [
  {
    value: 'graphite',
    label: 'Graphite',
    swatches: ['#fafafa', '#09090b', '#09090b'],
  },
  {
    value: 'terracotta',
    label: 'Terracotta',
    swatches: ['#fafafa', '#09090b', '#dc2626'],
  },
  {
    value: 'forest',
    label: 'Forest',
    swatches: ['#fafafa', '#09090b', '#16a34a'],
  },
  {
    value: 'plum',
    label: 'Plum',
    swatches: ['#fafafa', '#09090b', '#7c3aed'],
  },
  {
    value: 'classic',
    label: 'Classic',
    swatches: ['#faf8f5', '#1a1512', '#a32d1d'],
  },
];

const MODES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Appearance is a device preference, not site data - there's nothing here to
 * save to the API, so unlike every other Settings tab this one has no form
 * submission at all; each control writes straight to ThemeProvider (and so
 * to this browser's storage) the moment it's clicked.
 */
export function SettingsAppearanceForm() {
  const {
    palette,
    setPalette,
    customAccent,
    setCustomAccent,
    preference,
    setPreference,
  } = useTheme();
  const isCustom = palette === 'custom';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-ink">Appearance</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Choose how the CMS looks on this device. Saved to this browser only -
          everyone signed in can pick their own.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink">Color theme</h3>
        <p className="text-ink-subtle mt-1 text-sm">
          Pick a starting point, or choose any accent colour of your own.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PALETTES.map(({ value, label, swatches }) => {
            const selected = palette === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPalette(value)}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  selected
                    ? 'border-accent ring-accent/30 ring-2'
                    : 'border-hairline hover:border-ink-subtle/40',
                )}
              >
                <span className="flex gap-1.5">
                  {swatches.map((color, index) => (
                    <span
                      key={index}
                      className="border-hairline size-5 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{label}</span>
                  {selected && (
                    <Check
                      className="text-accent-text size-4 shrink-0"
                      aria-hidden
                    />
                  )}
                </span>
              </button>
            );
          })}

          <label
            className={cn(
              'cursor-pointer rounded-xl border p-3 text-left transition-colors',
              isCustom
                ? 'border-accent ring-accent/30 ring-2'
                : 'border-hairline hover:border-ink-subtle/40',
            )}
          >
            <span className="flex gap-1.5">
              <span
                className="border-hairline size-5 rounded-full border"
                style={{ backgroundColor: '#fafafa' }}
              />
              <span
                className="border-hairline size-5 rounded-full border"
                style={{ backgroundColor: '#09090b' }}
              />
              <span
                className="border-hairline relative size-5 overflow-hidden rounded-full border"
                style={{ backgroundColor: customAccent }}
              >
                <input
                  type="color"
                  value={customAccent}
                  onClick={() => setPalette('custom')}
                  onChange={(event) => {
                    setCustomAccent(event.target.value);
                    setPalette('custom');
                  }}
                  aria-label="Custom accent colour"
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </span>
            </span>
            <span className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">Custom</span>
              {isCustom ? (
                <Check
                  className="text-accent-text size-4 shrink-0"
                  aria-hidden
                />
              ) : (
                <Pipette
                  className="text-ink-subtle size-4 shrink-0"
                  aria-hidden
                />
              )}
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink">Light or dark</h3>
        <div className="border-hairline bg-surface-sunken mt-3 inline-flex rounded-lg border p-1">
          {MODES.map(({ value, label, icon: Icon }) => {
            const selected = preference === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPreference(value)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  selected
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
