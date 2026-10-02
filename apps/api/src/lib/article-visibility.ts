/**
 * What makes an article visible to readers: Published, and not past its
 * optional scheduled end. The time is the source of truth — nothing flips a
 * stored flag when an article ends — so every public query asks this at the
 * moment it runs. (The CMS still lists an ended article as Published.)
 */
export function liveArticleWhere(now = new Date()) {
  return {
    status: 'PUBLISHED' as const,
    OR: [{ endAt: null }, { endAt: { gt: now } }],
  };
}
