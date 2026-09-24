import { Prisma, type TransactionClient } from '@coastal-talk-news/db';

const mediaSelect = {
  select: { id: true, storageKey: true, width: true, height: true },
} as const;

const withMedia = {
  logo: mediaSelect,
  favicon: mediaSelect,
  defaultOgImage: mediaSelect,
} as const;

export type SiteSettingsRow = Awaited<ReturnType<typeof findFirst>>;

export function findFirst(db: TransactionClient) {
  return db.siteSettings.findFirst({ include: withMedia });
}

export interface SiteSettingsWriteData {
  siteName?: string;
  tagline?: string | null;
  logoMediaId?: string | null;
  faviconMediaId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  aboutTitle?: string | null;
  aboutIntro?: string | null;
  aboutContent?: object | null;
  aboutContentKannada?: object | null;
  contactTitle?: string | null;
  contactIntro?: string | null;
  contactHours?: string | null;
  advertiseTitle?: string | null;
  advertiseIntro?: string | null;
  advertiseContent?: object | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  whatsappEnglishUrl?: string | null;
  whatsappKannadaUrl?: string | null;
  defaultSeoTitle?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImageId?: string | null;
}

/** Clearing a nullable Json column needs Prisma's own null, not a bare one —
 * a bare null means "leave unchanged" to the query builder. */
function jsonOrNull(value: object | null) {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

export function update(
  db: TransactionClient,
  id: string,
  data: SiteSettingsWriteData,
) {
  const { aboutContent, aboutContentKannada, advertiseContent, ...rest } = data;
  return db.siteSettings.update({
    where: { id },
    data: {
      ...rest,
      ...(aboutContent !== undefined
        ? { aboutContent: jsonOrNull(aboutContent) }
        : {}),
      ...(aboutContentKannada !== undefined
        ? { aboutContentKannada: jsonOrNull(aboutContentKannada) }
        : {}),
      ...(advertiseContent !== undefined
        ? { advertiseContent: jsonOrNull(advertiseContent) }
        : {}),
    },
    include: withMedia,
  });
}

export function mediaExists(db: TransactionClient, mediaId: string) {
  return db.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
}
