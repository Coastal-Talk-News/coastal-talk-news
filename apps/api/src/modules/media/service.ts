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
import {
  ACCEPTED_MIME_TYPES,
  MAX_ASSET_BYTES,
  type ObjectStorage,
  type UploadTicket,
} from './storage.js';

export interface MediaServiceDeps {
  db: Database;
  storage: ObjectStorage;
  logger: FastifyBaseLogger;
  /** MEDIA_STORAGE_CAP_MB, in bytes - the ceiling total stored image size
   *  must stay under, regardless of which provider is active. */
  maxTotalBytes: number;
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

function capExceededMessage(usedBytes: number, maxTotalBytes: number): string {
  const usedMB = Math.round(usedBytes / 1_000_000);
  const limitMB = Math.round(maxTotalBytes / 1_000_000);
  return `Image storage is full (${usedMB}MB of ${limitMB}MB used). Delete unused images, or raise MEDIA_STORAGE_CAP_MB.`;
}

export async function createUploadSignature(
  { db, storage, maxTotalBytes }: MediaServiceDeps,
  input: { contentType: string },
): Promise<UploadTicket> {
  if (!ACCEPTED_MIME_TYPES.has(input.contentType)) {
    throw new UnsupportedMediaTypeError(
      `Unsupported image format: ${input.contentType}.`,
    );
  }

  // Checked here too, not just at register time, so a browser never spends
  // time and bandwidth on an upload that was always going to be refused.
  const used = await repository.totalStorageBytes(db);
  if (used >= maxTotalBytes) {
    throw new PayloadTooLargeError(capExceededMessage(used, maxTotalBytes));
  }

  return storage.createUploadTicket(input);
}

export interface RegisterUploadInput {
  storageKey: string;
  filename: string;
  /** Only used as a fallback when the storage backend can't report
   *  dimensions itself (S3-compatible). Cloudinary ignores these. */
  width?: number;
  height?: number;
}

/**
 * The second half of a direct upload: the browser already put the file in
 * storage itself, so this only has a storage key to go on. Format and byte
 * size are always read back from the storage backend directly rather than
 * trusted from the request, so a client can't register an asset that was
 * never actually uploaded, or lie about what it is. Dimensions come from the
 * backend too where it can report them (Cloudinary); where it can't
 * (S3-compatible storage has no notion of image content), they fall back to
 * what the browser already measured while compressing the file.
 */
export async function registerUpload(
  { db, storage, maxTotalBytes }: MediaServiceDeps,
  input: RegisterUploadInput,
) {
  const { storageKey, filename } = input;

  if (!storage.isManagedKey(storageKey)) {
    throw new BadRequestError('Not a recognised upload.');
  }

  const resource = await storage.getUploadedAsset(storageKey).catch(() => {
    throw new NotFoundError('Uploaded image');
  });

  if (resource.bytes > MAX_ASSET_BYTES) {
    await storage.delete(storageKey);
    throw new PayloadTooLargeError(
      `Image exceeds the ${Math.floor(MAX_ASSET_BYTES / 1024 / 1024)}MB limit.`,
    );
  }

  // The authoritative check: the one at signature time is only a
  // best-effort head start, since another upload could have landed in
  // between, or the cap could have been lowered since.
  const used = await repository.totalStorageBytes(db);
  if (used + resource.bytes > maxTotalBytes) {
    await storage.delete(storageKey);
    throw new PayloadTooLargeError(capExceededMessage(used, maxTotalBytes));
  }

  if (!ACCEPTED_MIME_TYPES.has(resource.contentType)) {
    await storage.delete(storageKey);
    throw new UnsupportedMediaTypeError(
      `Unsupported image format: ${resource.contentType}.`,
    );
  }

  const width = resource.width ?? input.width;
  const height = resource.height ?? input.height;
  if (!width || !height) {
    await storage.delete(storageKey);
    throw new BadRequestError('Could not determine the image dimensions.');
  }

  return repository.upsertByStorageKey(db, {
    filename: filename.trim() || 'Untitled image',
    storageKey,
    mimeType: resource.contentType,
    fileSize: resource.bytes,
    width,
    height,
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
