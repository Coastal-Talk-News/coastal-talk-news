import type { TransactionClient } from '@coastal-talk-news/db';

/**
 * A MediaAsset can be referenced from seven columns at once. Deleting one
 * referencing resource must not delete the asset while another reference
 * survives — only losing the last one deletes it. Every delete path and every
 * media-reference swap goes through here rather than re-deriving the check.
 */

async function countReferences(
  tx: TransactionClient,
  mediaId: string,
): Promise<number> {
  const [articles, categories, advertisements, settings] = await Promise.all([
    tx.article.count({
      where: { OR: [{ mediaId }, { ogImageId: mediaId }] },
    }),
    tx.category.count({ where: { mediaId } }),
    tx.advertisement.count({ where: { mediaId } }),
    tx.siteSettings.count({
      where: {
        OR: [
          { logoMediaId: mediaId },
          { faviconMediaId: mediaId },
          { defaultOgImageId: mediaId },
        ],
      },
    }),
  ]);

  return articles + categories + advertisements + settings;
}

export async function isMediaReferenced(
  tx: TransactionClient,
  mediaId: string,
): Promise<boolean> {
  return (await countReferences(tx, mediaId)) > 0;
}

/**
 * Call after the mutation that removed the reference, in the same transaction.
 * Deleting the returned storage keys from R2 is the caller's job and must
 * happen after commit — object storage has no rollback.
 */
export async function releaseMedia(
  tx: TransactionClient,
  mediaIds: Array<string | null | undefined>,
): Promise<string[]> {
  const unique = [
    ...new Set(mediaIds.filter((id): id is string => Boolean(id))),
  ];
  const orphanedStorageKeys: string[] = [];

  for (const mediaId of unique) {
    if (await isMediaReferenced(tx, mediaId)) {
      continue;
    }

    const asset = await tx.mediaAsset.findUnique({
      where: { id: mediaId },
      select: { storageKey: true },
    });
    if (!asset) {
      continue;
    }

    // deleteMany, not delete: concurrent callers can both see zero references,
    // and the loser must not fail on an already-deleted row.
    const { count } = await tx.mediaAsset.deleteMany({
      where: { id: mediaId },
    });
    if (count > 0) {
      orphanedStorageKeys.push(asset.storageKey);
    }
  }

  return orphanedStorageKeys;
}

export async function findUnreferencedMedia(
  tx: TransactionClient,
): Promise<Array<{ id: string; storageKey: string }>> {
  return tx.mediaAsset.findMany({
    where: {
      featuredForArticles: { none: {} },
      ogImageForArticles: { none: {} },
      categories: { none: {} },
      advertisements: { none: {} },
      logoForSettings: { none: {} },
      faviconForSettings: { none: {} },
      ogImageForSettings: { none: {} },
    },
    select: { id: true, storageKey: true },
  });
}

export interface MediaUsage {
  articles: number;
  categories: number;
  advertisements: number;
  settings: number;
  total: number;
}

/**
 * Usage counts for a page of assets in five queries, whatever the page size.
 * Counting per row would be four queries per asset.
 */
export async function countUsage(
  tx: TransactionClient,
  mediaIds: string[],
): Promise<Map<string, MediaUsage>> {
  const usage = new Map<string, MediaUsage>(
    mediaIds.map((id) => [
      id,
      { articles: 0, categories: 0, advertisements: 0, settings: 0, total: 0 },
    ]),
  );
  if (mediaIds.length === 0) {
    return usage;
  }

  const [featured, ogImages, categories, advertisements, settings] =
    await Promise.all([
      tx.article.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: mediaIds } },
        _count: { _all: true },
      }),
      tx.article.groupBy({
        by: ['ogImageId'],
        where: { ogImageId: { in: mediaIds } },
        _count: { _all: true },
      }),
      tx.category.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: mediaIds } },
        _count: { _all: true },
      }),
      tx.advertisement.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: mediaIds } },
        _count: { _all: true },
      }),
      tx.siteSettings.findMany({
        select: {
          logoMediaId: true,
          faviconMediaId: true,
          defaultOgImageId: true,
        },
      }),
    ]);

  const add = (
    id: string | null,
    key: keyof Omit<MediaUsage, 'total'>,
    by: number,
  ) => {
    if (!id) return;
    const entry = usage.get(id);
    if (!entry) return;
    entry[key] += by;
    entry.total += by;
  };

  for (const row of featured) add(row.mediaId, 'articles', row._count._all);
  for (const row of ogImages) add(row.ogImageId, 'articles', row._count._all);
  for (const row of categories) add(row.mediaId, 'categories', row._count._all);
  for (const row of advertisements)
    add(row.mediaId, 'advertisements', row._count._all);
  for (const row of settings) {
    add(row.logoMediaId, 'settings', 1);
    add(row.faviconMediaId, 'settings', 1);
    add(row.defaultOgImageId, 'settings', 1);
  }

  return usage;
}
