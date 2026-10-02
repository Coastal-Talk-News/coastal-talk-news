import { randomUUID } from 'node:crypto';

export interface PixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformOptions {
  /** Longest width to deliver; smaller pictures are never enlarged. Only
   *  Cloudinary can actually act on this - see ObjectStorage.publicUrl. */
  width?: number;
  /** The part of the original to keep, cropped on delivery. Only Cloudinary
   *  can actually act on this - see ObjectStorage.publicUrl. */
  region?: PixelRegion;
}

export interface CloudinaryUploadTicket {
  provider: 'cloudinary';
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  allowedFormats: string;
}

export interface S3UploadTicket {
  provider: 's3';
  uploadUrl: string;
  storageKey: string;
  /** Every field the browser's multipart POST must send alongside the file,
   *  in the order a presigned POST policy expects them. */
  fields: Record<string, string>;
}

export type UploadTicket = CloudinaryUploadTicket | S3UploadTicket;

export interface UploadedAsset {
  contentType: string;
  bytes: number;
  /** Null when the backend can't report dimensions without decoding the
   *  file itself, which plain object storage (S3/R2) can't do without
   *  downloading and processing it server-side - exactly what this whole
   *  design avoids. The caller falls back to whatever the browser already
   *  measured while compressing it. Cloudinary always reports the real
   *  numbers, since it understands image content natively. */
  width: number | null;
  height: number | null;
}

/**
 * One interface, two implementations (`cloudinary-storage.ts`,
 * `s3-storage.ts`), selected at startup by `STORAGE_PROVIDER` in
 * `createObjectStorage()`. Nothing outside this module's own provider files
 * should need to know which one is active.
 */
export interface ObjectStorage {
  readonly provider: 'cloudinary' | 's3';

  /** A storage key this server actually generated, as opposed to one a
   *  client made up. Every registered asset must pass this. */
  isManagedKey(storageKey: string): boolean;

  /**
   * A time-boxed, single-use ticket that lets the browser upload an image
   * straight to this backend - the file never passes through this server
   * at all. The storage key is minted here, not by the client.
   */
  createUploadTicket(input: { contentType: string }): Promise<UploadTicket>;

  /**
   * What actually landed in storage for this key, read back from the
   * backend's own records rather than trusted from the browser's report of
   * its own upload.
   */
  getUploadedAsset(storageKey: string): Promise<UploadedAsset>;

  delete(storageKey: string): Promise<void>;

  /** Usage toward a plan's allowance, where the backend has such a concept
   *  (Cloudinary's credits). Rejects when it doesn't (S3-compatible storage
   *  has no equivalent single figure) - callers already treat a failure
   *  here as "no usage meter to show," never as an error worth surfacing. */
  creditUsage(): Promise<{ used: number; limit: number }>;

  publicUrl(storageKey: string, options?: TransformOptions): string;
}

/** Shared by every provider so storage keys look and sort the same way
 *  regardless of which backend is active. */
export function generateStorageKey(folder: string): string {
  const now = new Date();
  const yearMonth = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${folder}/${yearMonth}/${randomUUID()}`;
}

/** The one image format allowlist every provider and the register step
 *  enforce against, so a format accepted at upload time is always a format
 *  accepted at registration time. */
export const ACCEPTED_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

/** There is no signed/conditioned "max bytes" parameter on every provider's
 *  upload API, so this is enforced again at register time regardless of
 *  whatever pre-upload limit a given provider does or doesn't support. */
export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
