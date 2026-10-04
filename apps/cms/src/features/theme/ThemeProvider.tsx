import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  bestAccentForeground,
  DEFAULT_CUSTOM_ACCENT,
  isValidHexColor,
} from './accentColor.js';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Palette =
  'graphite' | 'terracotta' | 'forest' | 'plum' | 'classic' | 'custom';

export const THEME_STORAGE_KEY = 'ctn-theme';
export const PALETTE_STORAGE_KEY = 'ctn-palette';
export const CUSTOM_ACCENT_STORAGE_KEY = 'ctn-custom-accent';
/** Matches theme.css's `:root` fallback and index.html's inline script. */
export const DEFAULT_PALETTE: Palette = 'graphite';
const PALETTES: Palette[] = [
  'graphite',
  'terracotta',
  'forest',
  'plum',
  'classic',
  'custom',
];

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  palette: Palette;
  setPalette: (palette: Palette) => void;
  /** Only meaningful while palette === 'custom', but always a valid hex -
   *  Settings keeps the colour input usable even before Custom is picked. */
  customAccent: string;
  setCustomAccent: (hex: string) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system')
      return stored;
  } catch {}
  return 'system';
}

function readStoredPalette(): Palette {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (PALETTES.includes(stored as Palette)) return stored as Palette;
  } catch {}
  return DEFAULT_PALETTE;
}

function readStoredCustomAccent(): string {
  try {
    const stored = localStorage.getItem(CUSTOM_ACCENT_STORAGE_KEY);
    if (stored && isValidHexColor(stored)) return stored;
  } catch {}
  return DEFAULT_CUSTOM_ACCENT;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const [palette, setPaletteState] = useState<Palette>(readStoredPalette);
  const [customAccent, setCustomAccentState] = useState<string>(
    readStoredCustomAccent,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolved: ResolvedTheme =
    preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  // Only the 'custom' theme reads --accent-base/--accent-fg (see
  // theme.css's [data-palette='custom'] block); setting them while any
  // named theme is active is harmless since nothing references them then.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent-base', customAccent);
    root.setProperty('--accent-fg', bestAccentForeground(customAccent));
  }, [customAccent]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }, []);

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {}
  }, []);

  const setCustomAccent = useCallback((next: string) => {
    if (!isValidHexColor(next)) return;
    setCustomAccentState(next);
    try {
      localStorage.setItem(CUSTOM_ACCENT_STORAGE_KEY, next);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
      palette,
      setPalette,
      customAccent,
      setCustomAccent,
    }),
    [
      preference,
      resolved,
      setPreference,
      palette,
      setPalette,
      customAccent,
      setCustomAccent,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
