import type { Database } from '@coastal-talk-news/db';
import type { FastifyBaseLogger } from 'fastify';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { toSkipTake } from '../../lib/pagination.js';
import {
  countUsage,
  findUnreferencedMedia,
  type MediaUsage,
} from './reference.js';
import * as repository from './repository.js';
import type { ObjectStorage, UploadSignature } from './storage.js';

export interface MediaServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
}

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

/**
 * There is no signed "max bytes" upload parameter - Cloudinary only lets
 * that be capped account-wide, in its dashboard. This is the backstop for
 * someone who skips the browser's own compression and uploads something
 * huge directly: it is still rejected, just one request later than ideal,
 * and the object is removed from Cloudinary rather than left billing
 * storage with nothing in our own database pointing at it.
 */
const MAX_ASSET_BYTES = 10 * 1024 * 1024;

/** Cloudinary's own `format`, which it derives from the file's actual
 *  content - never what the client's register call might claim. */
const MIME_BY_FORMAT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

export function createUploadSignature({
  storage,
}: MediaServiceDeps): UploadSignature {
  return storage.createUploadSignature();
}

export interface RegisterUploadInput {
  publicId: string;
  filename: string;
}

/**
 * The second half of a direct-to-Cloudinary upload: the browser already put
 * the file there itself, so this only has a public id to go on. Everything
 * that ends up in the database - format, dimensions, byte size - is read
 * back from Cloudinary directly rather than trusted from the request, so a
 * client can't register an asset that was never actually uploaded, or lie
 * about what it is.
 */
export async function registerUpload(
  { db, storage }: MediaServiceDeps,
  input: RegisterUploadInput,
) {
  const { publicId, filename } = input;

  if (!storage.isManagedKey(publicId)) {
    throw new BadRequestError('Not a recognised upload.');
  }

  const resource = await storage.getUploadedAsset(publicId).catch(() => {
    throw new NotFoundError('Uploaded image');
  });

  if (resource.bytes > MAX_ASSET_BYTES) {
    await storage.delete(publicId);
    throw new PayloadTooLargeError(
      `Image exceeds the ${Math.floor(MAX_ASSET_BYTES / 1024 / 1024)}MB limit.`,
    );
  }

  const mimeType = MIME_BY_FORMAT[resource.format.toLowerCase()];
  if (!mimeType) {
    await storage.delete(publicId);
    throw new UnsupportedMediaTypeError(
      `Unsupported image format: ${resource.format}.`,
    );
  }

  return repository.upsertByStorageKey(db, {
    filename: filename.trim() || 'Untitled image',
    storageKey: publicId,
    mimeType,
    fileSize: resource.bytes,
    width: resource.width,
    height: resource.height,
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
