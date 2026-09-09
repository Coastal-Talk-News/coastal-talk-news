import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Env } from '../../config/env.js';

/**
 * Uploads are proxied through the API, not presigned to the browser: a
 * presigned PUT would let a client skip content validation and Sharp.
 */
export class ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(env: Env) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = env.R2_BUCKET;
    this.publicBaseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
  }

  /** Random, not the upload's filename: those collide, can carry path
   * traversal, and would leak into public URLs. */
  buildStorageKey(extension: string): string {
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return `${yearMonth}/${randomUUID()}.${extension}`;
  }

  async put(storageKey: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: body,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }

  publicUrl(storageKey: string): string {
    return `${this.publicBaseUrl}/${storageKey}`;
  }
}
