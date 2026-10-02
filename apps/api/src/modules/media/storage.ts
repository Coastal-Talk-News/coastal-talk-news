import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../../config/env.js';

export interface PixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformOptions {
  /** Longest width to deliver; smaller pictures are never enlarged. */
  width?: number;
  /** The part of the original to keep. Cropping happens on delivery, so the
   *  stored original is untouched and the crop can be changed later. */
  region?: PixelRegion;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  /** Comma-separated, exactly as Cloudinary expects it on the upload call
   *  that redeems this signature - it's signed, so widening it client-side
   *  just makes the signature invalid rather than the restriction. */
  allowedFormats: string;
}

export interface UploadedAsset {
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/** Keyed by Cloudinary's own `format`, which it derives from the file's
 *  actual content, not whatever the browser claimed. */
const ACCEPTED_FORMATS = ['jpg', 'png', 'webp', 'avif', 'gif'] as const;

export class ObjectStorage {
  private readonly folder: string;
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(env: Env) {
    this.cloudName = env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = env.CLOUDINARY_API_KEY;
    this.apiSecret = env.CLOUDINARY_API_SECRET;
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
    this.folder = env.CLOUDINARY_FOLDER;
  }

  buildStorageKey(): string {
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return `${this.folder}/${yearMonth}/${randomUUID()}`;
  }

  /** A storage key this server actually generated, as opposed to one a
   *  client made up. Every registered asset must pass this. */
  isManagedKey(storageKey: string): boolean {
    return storageKey.startsWith(`${this.folder}/`);
  }

  /**
   * A time-boxed, single-use ticket that lets the browser upload an image
   * straight to Cloudinary - the file never passes through this server at
   * all. `public_id` is minted here, not by the client, so where it's stored
   * is never in the browser's hands either.
   */
  createUploadSignature(): UploadSignature {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = this.buildStorageKey();
    const allowedFormats = ACCEPTED_FORMATS.join(',');

    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp, allowed_formats: allowedFormats },
      this.apiSecret,
    );

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      publicId,
      allowedFormats,
    };
  }

  /**
   * What actually landed in Cloudinary for this key, read back from
   * Cloudinary's own records. A direct upload means the browser is the one
   * reporting success, so this - not the browser - is what the stored
   * dimensions and byte size come from. Throws if nothing is there.
   */
  async getUploadedAsset(storageKey: string): Promise<UploadedAsset> {
    const resource = (await cloudinary.api.resource(storageKey, {
      resource_type: 'image',
    })) as {
      format?: string;
      width?: number;
      height?: number;
      bytes?: number;
    };

    const { format, width, height, bytes } = resource;
    if (!format || !width || !height || typeof bytes !== 'number') {
      throw new Error('Cloudinary did not report this image fully.');
    }
    return { format, width, height, bytes };
  }

  async delete(storageKey: string): Promise<void> {
    await cloudinary.uploader.destroy(storageKey, { resource_type: 'image' });
  }

  /** Credits used this billing period, and the plan's allowance. */
  async creditUsage(): Promise<{ used: number; limit: number }> {
    const usage = (await cloudinary.api.usage()) as {
      credits?: { usage?: number; limit?: number };
    };
    const { usage: used, limit } = usage.credits ?? {};
    if (typeof used !== 'number' || typeof limit !== 'number') {
      throw new Error('Cloudinary did not report credit usage.');
    }
    return { used, limit };
  }

  publicUrl(storageKey: string, options: TransformOptions = {}): string {
    return cloudinary.url(storageKey, {
      secure: true,
      transformation: [
        ...(options.region ? [{ crop: 'crop', ...options.region }] : []),
        {
          fetch_format: 'auto',
          quality: 'auto',
          ...(options.width ? { width: options.width, crop: 'limit' } : {}),
        },
      ],
    });
  }
}
