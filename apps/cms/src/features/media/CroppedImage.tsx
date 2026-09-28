import type { ImageCrop } from '@coastal-talk-news/types';
import { cn } from '@coastal-talk-news/ui/cn';

interface CroppedImageProps {
  src: string;
  alt?: string;
  /** The whole picture's size, in pixels. */
  width: number;
  height: number;
  crop: ImageCrop | null;
  className?: string;
}

/**
 * Shows the cropped part of the original by scaling and shifting it inside a
 * clipped box, so a crop can be changed without fetching another file. The
 * reader site gets the same picture already cut on delivery.
 */
export function CroppedImage({
  src,
  alt = '',
  width,
  height,
  crop,
  className,
}: CroppedImageProps) {
  if (!crop) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        className={cn('block h-auto w-full', className)}
      />
    );
  }

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{ aspectRatio: (crop.width * width) / (crop.height * height) }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute block h-auto max-w-none"
        style={{
          width: `${100 / crop.width}%`,
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
        }}
      />
    </div>
  );
}
