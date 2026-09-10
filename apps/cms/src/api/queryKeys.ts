/**
 * Every cache key in one place. Raw arrays at call sites drift, and a mismatch
 * fails silently — the query simply never invalidates.
 */
export const queryKeys = {
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  dashboard: ['dashboard'] as const,
  categories: ['categories'] as const,
  media: ['media'] as const,
  mediaList: (params: Record<string, unknown>) => ['media', params] as const,
  categoryList: (params: Record<string, unknown>) =>
    ['categories', params] as const,
} as const;
