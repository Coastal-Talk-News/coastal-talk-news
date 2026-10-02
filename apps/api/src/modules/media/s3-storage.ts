import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import type { Env } from '../../config/env.js';
import {
  generateStorageKey,
  MAX_ASSET_BYTES,
  type ObjectStorage,
  type TransformOptions,
  type UploadedAsset,
  type UploadTicket,
} from './storage-types.js';

// Single-use, and only redeemable within this window.
const TICKET_EXPIRY_SECONDS = 10 * 60;

/**
 * Any object storage that speaks the S3 API - real AWS S3, Cloudflare R2, or
 * another S3-compatible provider. Which one is live is entirely a matter of
 * S3_ENDPOINT/S3_REGION/S3_FORCE_PATH_STYLE: nothing in this class is
 * specific to any one of them.
 */
export class S3Storage implements ObjectStorage {
  readonly provider = 's3' as const;

  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly folder: string;
  private readonly publicBaseUrl: string;

  constructor(env: Env) {
    if (
      !env.S3_BUCKET ||
      !env.S3_REGION ||
      !env.S3_ACCESS_KEY_ID ||
      !env.S3_SECRET_ACCESS_KEY ||
      !env.S3_PUBLIC_URL
    ) {
      // loadEnv() already guarantees this; guarded again here so this class
      // is never silently misconfigured if constructed some other way.
      throw new Error('S3-compatible storage is missing its configuration.');
    }
    this.bucket = env.S3_BUCKET;
    this.folder = env.S3_FOLDER;
    this.publicBaseUrl = env.S3_PUBLIC_URL.replace(/\/$/, '');
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  isManagedKey(storageKey: string): boolean {
    return storageKey.startsWith(`${this.folder}/`);
  }

  async createUploadTicket(input: {
    contentType: string;
  }): Promise<UploadTicket> {
    const storageKey = generateStorageKey(this.folder);

    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: storageKey,
      Expires: TICKET_EXPIRY_SECONDS,
      Conditions: [
        ['content-length-range', 0, MAX_ASSET_BYTES],
        ['eq', '$Content-Type', input.contentType],
      ],
      Fields: {
        key: storageKey,
        'Content-Type': input.contentType,
      },
    });

    return { provider: 's3', uploadUrl: url, storageKey, fields };
  }

  async getUploadedAsset(storageKey: string): Promise<UploadedAsset> {
    const result = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );

    if (typeof result.ContentLength !== 'number' || !result.ContentType) {
      throw new Error('Object storage did not report this upload fully.');
    }

    // Plain object storage has no idea what an image actually contains -
    // this is the Content-Type the browser's upload request declared, not
    // anything verified against the file's real bytes. The register step
    // re-checks it against the accepted format list regardless.
    return {
      contentType: result.ContentType,
      bytes: result.ContentLength,
      width: null,
      height: null,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }

  async creditUsage(): Promise<{ used: number; limit: number }> {
    throw new Error(
      'Usage reporting is not available for S3-compatible storage.',
    );
  }

  /**
   * Plain object storage has no on-the-fly image transforms - `options` is
   * accepted for interface compatibility but has no effect. A delivered
   * image is always the original upload at its original size; cropping a
   * featured image has nothing to act on here. See "Media flow" in
   * docs/DATA-MODEL.md.
   */
  publicUrl(storageKey: string, _options: TransformOptions = {}): string {
    return `${this.publicBaseUrl}/${storageKey}`;
  }
}
