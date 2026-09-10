import type { Database } from '@coastal-talk-news/db';
import type { FastifyBaseLogger } from 'fastify';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import { processUpload } from './image.js';
import {
  countUsage,
  findUnreferencedMedia,
  type MediaUsage,
} from './reference.js';
import * as repository from './repository.js';
import type { ObjectStorage } from './storage.js';

export interface MediaServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
}

/**
 * Deletes R2 objects whose rows are already gone. Runs after the transaction
 * commits, so a failure leaves an unreachable object rather than a broken
 * reference — recoverable by the cleanup action, so it is logged not thrown.
 */
export async function purgeStorageObjects(
  storage: ObjectStorage,
  logger: FastifyBaseLogger,
  storageKeys: string[],
): Promise<void> {
  await Promise.all(
    storageKeys.map(async (storageKey) => {
      try {
        await storage.delete(storageKey);
      } catch (error) {
        logger.error(
          { err: error, storageKey },
          'Failed to delete orphaned object',
        );
      }
    }),
  );
}

export async function list(
  { db }: MediaServiceDeps,
  filters: repository.ListFilters,
  pagination: PaginationParams,
) {
  const [rows, total] = await Promise.all([
    repository.findMany(db, filters, toSkipTake(pagination)),
    repository.count(db, filters),
  ]);
  const usage = await countUsage(
    db,
    rows.map((row) => row.id),
  );
  return { rows, total, usage };
}

export async function getById({ db }: MediaServiceDeps, id: string) {
  const asset = await repository.findById(db, id);
  if (!asset) {
    throw new NotFoundError('Media');
  }
  const usage = await countUsage(db, [asset.id]);
  return { asset, usage: usage.get(asset.id) };
}

export interface UploadInput {
  filename: string;
  buffer: Buffer;
}

export async function upload(
  { db, storage }: MediaServiceDeps,
  input: UploadInput,
) {
  const processed = await processUpload(input.buffer);
  const storageKey = storage.buildStorageKey();

  // Object first: a stored file with no row is invisible and sweepable, while a
  // row with no object renders as a broken image everywhere it is used.
  await storage.put(storageKey, processed.buffer);

  return repository.create(db, {
    filename: input.filename,
    storageKey,
    mimeType: processed.mimeType,
    fileSize: processed.fileSize,
    width: processed.width,
    height: processed.height,
  });
}

function describeUsage(usage: MediaUsage): string {
  const parts = [
    usage.articles && `${usage.articles} article(s)`,
    usage.categories && `${usage.categories} category(ies)`,
    usage.advertisements && `${usage.advertisements} advertisement(s)`,
    usage.settings && `${usage.settings} settings field(s)`,
  ].filter(Boolean);
  return parts.join(', ');
}

export async function remove(
  deps: MediaServiceDeps,
  id: string,
): Promise<void> {
  const { db, storage, logger } = deps;

  const storageKey = await db.$transaction(async (tx) => {
    const asset = await repository.findById(tx, id);
    if (!asset) {
      throw new NotFoundError('Media');
    }

    const usage = (await countUsage(tx, [id])).get(id);
    if (usage && usage.total > 0) {
      throw new ConflictError(
        `This image is still used by ${describeUsage(usage)}. Remove it there first.`,
        { usage },
      );
    }

    await repository.remove(tx, id);
    return asset.storageKey;
  });

  await purgeStorageObjects(storage, logger, [storageKey]);
}

/** Admin-triggered only. V1 has no scheduled sweep. */
export async function cleanupUnused(deps: MediaServiceDeps): Promise<number> {
  const { db, storage, logger } = deps;

  const orphaned = await db.$transaction(async (tx) => {
    const assets = await findUnreferencedMedia(tx);
    for (const asset of assets) {
      await repository.remove(tx, asset.id);
    }
    return assets.map((asset) => asset.storageKey);
  });

  await purgeStorageObjects(storage, logger, orphaned);
  return orphaned.length;
}
