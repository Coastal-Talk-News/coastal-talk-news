import { randomUUID } from 'node:crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import type { Env } from '../../config/env.js';

function describeUploadError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Upload failed.';
}

export interface TransformOptions {
  width?: number;
}

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
