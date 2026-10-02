import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../../config/env.js';
import {
  ACCEPTED_MIME_TYPES,
  generateStorageKey,
  type ObjectStorage,
  type TransformOptions,
  type UploadedAsset,
  type UploadTicket,
} from './storage-types.js';

/** Cloudinary's own `format`, which it derives from the file's actual
 *  content - never what a client might claim. */
const MIME_BY_FORMAT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

const ACCEPTED_FORMATS = ['jpg', 'png', 'webp', 'avif', 'gif'] as const;

export class CloudinaryStorage implements ObjectStorage {
  readonly provider = 'cloudinary' as const;

  private readonly folder: string;
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(env: Env) {
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      // loadEnv() already guarantees this; guarded again here so this class
      // is never silently misconfigured if constructed some other way.
      throw new Error('Cloudinary storage is missing its configuration.');
    }
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

  isManagedKey(storageKey: string): boolean {
    return storageKey.startsWith(`${this.folder}/`);
  }

  async createUploadTicket(): Promise<UploadTicket> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = generateStorageKey(this.folder);
    const allowedFormats = ACCEPTED_FORMATS.join(',');

    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp, allowed_formats: allowedFormats },
      this.apiSecret,
    );

    return {
      provider: 'cloudinary',
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      publicId,
      allowedFormats,
    };
  }

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

    const contentType = MIME_BY_FORMAT[format.toLowerCase()];
    if (!contentType || !ACCEPTED_MIME_TYPES.has(contentType)) {
      // Reported as its own content type rather than rejected here, so the
      // caller's one shared format check (and its cleanup-on-reject) stays
      // in the service layer instead of being duplicated per provider.
      return {
        contentType: `image/${format.toLowerCase()}`,
        bytes,
        width,
        height,
      };
    }

    return { contentType, bytes, width, height };
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

  /**
   * Deliberately no `transformation` here. A width limit, a crop, or even
   * `quality: auto` / `fetch_format: auto` makes Cloudinary generate and
   * keep a derived copy of the asset the first time that exact URL is
   * requested - storage and transformation credits spent on a variant of a
   * file that was already resized and compressed in the browser before it
   * ever got here. This always serves the original upload as-is; `options`
   * is accepted for interface compatibility but has no effect. See "Media
   * flow" in docs/DATA-MODEL.md.
   */
  publicUrl(storageKey: string, _options: TransformOptions = {}): string {
    return cloudinary.url(storageKey, { secure: true });
  }
}
