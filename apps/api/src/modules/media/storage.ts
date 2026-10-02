import type { Env } from '../../config/env.js';
import { CloudinaryStorage } from './cloudinary-storage.js';
import { S3Storage } from './s3-storage.js';
import type { ObjectStorage } from './storage-types.js';

export type {
  CloudinaryUploadTicket,
  ObjectStorage,
  PixelRegion,
  S3UploadTicket,
  TransformOptions,
  UploadedAsset,
  UploadTicket,
} from './storage-types.js';
export { ACCEPTED_MIME_TYPES, MAX_ASSET_BYTES } from './storage-types.js';

/** Picks the live backend from `STORAGE_PROVIDER` - the only place this
 *  server branches on which one is active. Every call site downstream just
 *  programs against `ObjectStorage`. */
export function createObjectStorage(env: Env): ObjectStorage {
  switch (env.STORAGE_PROVIDER) {
    case 'cloudinary':
      return new CloudinaryStorage(env);
    case 's3':
      return new S3Storage(env);
  }
}
