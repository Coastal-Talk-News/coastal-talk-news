import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPrismaClient } from '@coastal-talk-news/db';
import { v2 as cloudinary } from 'cloudinary';

/**
 * One-off: copies every media asset's original file from Cloudinary to the
 * configured S3-compatible bucket (AWS S3, Cloudflare R2, or anything else
 * that speaks the S3 API), keyed by the exact `storageKey` already in the
 * database - no DB write happens here, since the API resolves a public URL
 * from `storageKey` at request time rather than storing one (see
 * `ObjectStorage.publicUrl` in `../modules/media/storage-types.ts`).
 *
 * Safe to re-run: an object already present at the destination with the
 * right size is skipped. Never deletes or modifies anything in Cloudinary -
 * verify the migrated images actually load (e.g. flip STORAGE_PROVIDER to
 * s3 and check the CMS/site), then delete the Cloudinary assets yourself
 * once you're satisfied, whenever you're ready.
 *
 * This needs both providers' credentials at once, regardless of which one
 * STORAGE_PROVIDER currently points at - fill in the commented-out
 * CLOUDINARY_* block in apps/api/.env alongside the active S3_* one before
 * running this, and comment them out again afterward if you'd rather not
 * leave both sets of credentials live.
 *
 * Usage:
 *   pnpm --filter api media:migrate-cloudinary-to-s3
 *   pnpm --filter api media:migrate-cloudinary-to-s3 -- --dry-run
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

const DATABASE_URL = requireEnv('DATABASE_URL');
const CLOUDINARY_CLOUD_NAME = requireEnv('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = requireEnv('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = requireEnv('CLOUDINARY_API_SECRET');
const S3_BUCKET = requireEnv('S3_BUCKET');
const S3_REGION = requireEnv('S3_REGION');
const S3_ACCESS_KEY_ID = requireEnv('S3_ACCESS_KEY_ID');
const S3_SECRET_ACCESS_KEY = requireEnv('S3_SECRET_ACCESS_KEY');

const dryRun = process.argv.includes('--dry-run');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

async function alreadyMigrated(
  storageKey: string,
  expectedBytes: number,
): Promise<boolean> {
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: storageKey }),
    );
    return head.ContentLength === expectedBytes;
  } catch {
    return false;
  }
}

const db = createPrismaClient(DATABASE_URL);

try {
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      storageKey: true,
      filename: true,
      mimeType: true,
      fileSize: true,
    },
  });

  console.log(
    `${assets.length} media asset(s) to check${dryRun ? ' (dry run - nothing will be uploaded)' : ''}.`,
  );

  let migrated = 0;
  let skipped = 0;
  const failed: { storageKey: string; filename: string; reason: string }[] = [];

  for (const [index, asset] of assets.entries()) {
    const label = `[${index + 1}/${assets.length}] ${asset.storageKey} (${asset.filename})`;

    try {
      if (await alreadyMigrated(asset.storageKey, asset.fileSize)) {
        console.log(`${label} - already in S3, skipping`);
        skipped++;
        continue;
      }

      const sourceUrl = cloudinary.url(asset.storageKey, { secure: true });
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(
          `Cloudinary returned ${response.status} fetching ${sourceUrl}`,
        );
      }
      const bytes = Buffer.from(await response.arrayBuffer());

      if (bytes.length !== asset.fileSize) {
        throw new Error(
          `Downloaded ${bytes.length} bytes, database expects ${asset.fileSize}`,
        );
      }

      if (!dryRun) {
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: asset.storageKey,
            Body: bytes,
            ContentType: asset.mimeType,
          }),
        );

        const verify = await s3.send(
          new HeadObjectCommand({
            Bucket: S3_BUCKET,
            Key: asset.storageKey,
          }),
        );
        if (verify.ContentLength !== asset.fileSize) {
          throw new Error(
            `Uploaded but S3 reports ${verify.ContentLength} bytes, expected ${asset.fileSize}`,
          );
        }
      }

      console.log(
        `${label} - ${dryRun ? 'would migrate' : 'migrated'} (${asset.fileSize} bytes)`,
      );
      migrated++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`${label} - FAILED: ${reason}`);
      failed.push({
        storageKey: asset.storageKey,
        filename: asset.filename,
        reason,
      });
    }
  }

  console.log('');
  console.log(
    `Done. ${migrated} migrated, ${skipped} already present, ${failed.length} failed, out of ${assets.length} total.`,
  );
  if (failed.length > 0) {
    console.log('Failed assets:');
    for (const f of failed) {
      console.log(`  - ${f.storageKey} (${f.filename}): ${f.reason}`);
    }
    process.exitCode = 1;
  }
} finally {
  await db.$disconnect();
}
