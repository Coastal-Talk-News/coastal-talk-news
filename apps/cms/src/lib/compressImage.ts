/** Longest edge kept on upload; mirrors what the server used to resize to. */
const MAX_EDGE = 2400;
/** 0-1 scale; matches the server's old WebP quality of 82/100. */
const QUALITY = 0.82;
/** Refused before even trying to decode - a large original is still fine,
 *  this is only a guard against freezing the tab on something absurd. */
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export interface CompressedImage {
  file: File;
  /** Null only when the browser couldn't decode the file at all - the
   *  upload still proceeds with the original bytes, just without a
   *  dimension fallback to offer a storage backend that can't measure the
   *  image itself (S3-compatible). Cloudinary never needs this. */
  width: number | null;
  height: number | null;
}

function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Resizes and re-encodes an image in the browser before it ever leaves the
 * device, the same way the server used to on receipt: capped at a 2400px
 * edge, re-encoded as WebP, EXIF orientation baked in rather than carried as
 * metadata (which routinely includes GPS location).
 *
 * GIFs pass through untouched - canvas re-encoding only ever keeps one
 * frame, which would silently destroy an animation. Anything that fails to
 * re-encode, or that came out larger than it went in, falls back to the
 * original file rather than blocking the upload; the real dimensions are
 * still reported in that case, since they don't depend on which bytes end
 * up being uploaded.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error(`"${file.name}" is not a supported image format.`);
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `"${file.name}" exceeds the ${Math.floor(MAX_INPUT_BYTES / 1024 / 1024)}MB limit.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Not decodable here at all (an unusual encoder, a browser gap) - let
    // the upload proceed with the original and leave the verdict to
    // storage; there is nothing to measure it with either.
    return { file, width: null, height: null };
  }

  try {
    if (file.type === 'image/gif') {
      return { file, width: bitmap.width, height: bitmap.height };
    }

    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, width: bitmap.width, height: bitmap.height };
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    );
    if (!blob || blob.size >= file.size) {
      return { file, width: bitmap.width, height: bitmap.height };
    }

    const newName = `${file.name.replace(/\.[^./]+$/, '')}.webp`;
    return {
      file: new File([blob], newName, {
        type: 'image/webp',
        lastModified: file.lastModified,
      }),
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}
