import type { TransactionClient } from '@coastal-talk-news/db';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

const withMedia = {
  logo: mediaSelect,
  favicon: mediaSelect,
  defaultOgImage: mediaSelect,
} as const;

export type SiteSettingsRow = Awaited<ReturnType<typeof findFirst>>;

// No id-keyed finder, no create, no remove, no count — SiteSettings is a
// singleton with exactly one row, created once by the seed. The API never
// creates or deletes it, only reads and updates the one existing row.
export function findFirst(db: TransactionClient) {
  return db.siteSettings.findFirst({ include: withMedia });
}

export interface SiteSettingsWriteData {
  siteName?: string;
  tagline?: string | null;
  description?: string | null;
  logoMediaId?: string | null;
  faviconMediaId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageId?: string | null;
}

export function update(
  db: TransactionClient,
  id: string,
  data: SiteSettingsWriteData,
) {
  return db.siteSettings.update({ where: { id }, data, include: withMedia });
}

export function mediaExists(db: TransactionClient, mediaId: string) {
  return db.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
}
