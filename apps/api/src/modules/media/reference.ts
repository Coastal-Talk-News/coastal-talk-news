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
