/**
 * One list, read by both the key handler and the shortcuts chart, so the
 * chart can never drift from what the keys actually do.
 *
 * Keys follow what people already know from GitHub, Gmail and VS Code —
 * `g` then a letter to go somewhere, `c` to create, `/` to search, `?` for
 * help — rather than anything invented here.
 */

export interface GoToTarget {
  key: string;
  to: string;
  label: string;
}

/** Each letter is the first letter of the sidebar label it jumps to. */
export const GO_TO_TARGETS: GoToTarget[] = [
  { key: 'd', to: '/', label: 'Dashboard' },
  { key: 'n', to: '/articles', label: 'News' },
  { key: 'c', to: '/categories', label: 'Categories' },
  { key: 'l', to: '/latest-news', label: 'Latest News' },
  { key: 'a', to: '/advertisements', label: 'Advertisements' },
  { key: 'm', to: '/media', label: 'Media Library' },
  { key: 's', to: '/settings', label: 'Settings' },
];

export interface ShortcutEntry {
  /** Rendered one <kbd> per entry. */
  keys: string[];
  /** Pressed one after another rather than together. */
  sequence?: boolean;
  /** Either key does the job, rather than both together. */
  alternatives?: boolean;
  label: string;
  /** Shown under the label when the shortcut only applies somewhere. */
  note?: string;
}

export interface ShortcutGroup {
  title: string;
  entries: ShortcutEntry[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Go to',
    entries: GO_TO_TARGETS.map((target) => ({
      keys: ['G', target.key.toUpperCase()],
      sequence: true,
      label: target.label,
    })),
  },
  {
    title: 'On this page',
    entries: [
      {
        keys: ['C'],
        label: 'Create new',
        note: 'News, Categories, Latest News, Advertisements',
      },
      {
        keys: ['/'],
        label: 'Search this page',
        note: 'News, Categories, Media Library',
      },
      { keys: ['[', ']'], alternatives: true, label: 'Previous or next tab' },
      {
        keys: ['←', '→'],
        alternatives: true,
        label: 'Move along a tab row',
        note: 'While a tab is focused',
      },
    ],
  },
  {
    title: 'Editing',
    entries: [
      { keys: ['Ctrl', 'S'], label: 'Save' },
      { keys: ['Esc'], label: 'Close panel or dialog' },
    ],
  },
  {
    title: 'View',
    entries: [
      { keys: ['Ctrl', 'Shift', 'B'], label: 'Show or hide sidebar' },
      { keys: ['?'], label: 'Keyboard shortcuts' },
    ],
  },
];
