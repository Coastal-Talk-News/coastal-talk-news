import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import {
  BadRequestError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from '../../lib/errors.js';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Cloudinary resizes per request, so the stored copy only needs to cover the
// largest use — a full-bleed hero on a retina screen.
const MAX_STORED_EDGE = 2400;

/**
 * Keyed by magic-byte signature, never the supplied filename or Content-Type:
 * a .jpg that is really an .svg becomes stored XSS once served from the bucket.
 */
const ACCEPTED = new Map<string, { extension: string; mimeType: string }>([
  ['image/jpeg', { extension: 'jpg', mimeType: 'image/jpeg' }],
  ['image/png', { extension: 'png', mimeType: 'image/png' }],
  ['image/webp', { extension: 'webp', mimeType: 'image/webp' }],
  ['image/avif', { extension: 'avif', mimeType: 'image/avif' }],
  ['image/gif', { extension: 'gif', mimeType: 'image/gif' }],
]);

export interface ProcessedImage {
  buffer: Buffer;
  extension: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
}

/** Re-encoding to WebP also strips EXIF, which routinely carries GPS location. */
export async function processUpload(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength === 0) {
    throw new BadRequestError('Uploaded file is empty.');
  }
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new PayloadTooLargeError(
      `File exceeds the ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`,
    );
  }

  const detected = await fileTypeFromBuffer(input);
  const accepted = detected ? ACCEPTED.get(detected.mime) : undefined;
  if (!accepted) {
    throw new UnsupportedMediaTypeError(
      `Unsupported image format. Accepted formats: ${[...ACCEPTED.keys()].join(', ')}.`,
    );
  }

  // failOn 'none' keeps malformed but renderable images working;
  // limitInputPixels guards against decompression bombs.
  const metadata = await sharp(input, {
    failOn: 'none',
    limitInputPixels: 268402689,
  }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new BadRequestError('Could not read image dimensions.');
  }

  const isAnimated = (metadata.pages ?? 1) > 1;
  const output = isAnimated
    ? {
        buffer: input,
        extension: accepted.extension,
        mimeType: accepted.mimeType,
      }
    : {
        buffer: await sharp(input, { failOn: 'none' })
          .rotate()
          .resize({
            width: MAX_STORED_EDGE,
            height: MAX_STORED_EDGE,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer(),
        extension: 'webp',
        mimeType: 'image/webp',
      };

  return {
    ...output,
    // Re-measured because .rotate() applies EXIF orientation, which can swap
    // width and height.
    ...(await readDimensions(output.buffer, metadata.width, metadata.height)),
    fileSize: output.buffer.byteLength,
  };
}

async function readDimensions(
  buffer: Buffer,
  fallbackWidth: number,
  fallbackHeight: number,
): Promise<{ width: number; height: number }> {
  const { width, height } = await sharp(buffer, { failOn: 'none' }).metadata();
  return { width: width ?? fallbackWidth, height: height ?? fallbackHeight };
}
