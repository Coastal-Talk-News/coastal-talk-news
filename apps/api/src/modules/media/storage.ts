import { randomUUID } from 'node:crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import type { Env } from '../../config/env.js';

// Cloudinary rejects with a plain { message, http_code } object, not an Error,
// so the real cause was being discarded in favor of a generic message.
function describeUploadError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Upload failed.';
}

export interface TransformOptions {
  /** Longest edge in pixels. Omit for the stored size. */
  width?: number;
}

/**
 * Cloudinary media storage.
 *
 * Uploads are proxied through the API rather than sent from the browser: a
 * direct upload would skip content validation and Sharp.
 */
export class ObjectStorage {
  private readonly folder: string;

  constructor(env: Env) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.folder = env.CLOUDINARY_FOLDER;
  }

  /**
   * Random, not the upload's filename: those collide, can carry path traversal,
   * and would leak into public URLs.
   */
  buildStorageKey(): string {
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return `${this.folder}/${yearMonth}/${randomUUID()}`;
  }

  put(storageKey: string, body: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: storageKey,
          resource_type: 'image',
          // The bytes are already validated and re-encoded by Sharp; letting
          // Cloudinary transform on upload would spend credits twice.
          overwrite: false,
        },
        (error?: unknown, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new Error(describeUploadError(error)),
            );
            return;
          }
          resolve();
        },
      );
      stream.end(body);
    });
  }

  async delete(storageKey: string): Promise<void> {
    await cloudinary.uploader.destroy(storageKey, { resource_type: 'image' });
  }

  /**
   * f_auto serves AVIF or WebP based on the browser's Accept header and q_auto
   * picks a quality per image, so one stored file covers every client. Passing
   * a width returns a resized derivative rather than the full-size original.
   */
  publicUrl(storageKey: string, options: TransformOptions = {}): string {
    return cloudinary.url(storageKey, {
      secure: true,
      transformation: [
        {
          fetch_format: 'auto',
          quality: 'auto',
          ...(options.width ? { width: options.width, crop: 'limit' } : {}),
        },
      ],
    });
  }
}
