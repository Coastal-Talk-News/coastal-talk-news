import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { MediaSummaryDto } from '@coastal-talk-news/types';

interface StoryImageProps {
  image: MediaSummaryDto | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function StoryImage({
  image,
  alt,
  sizes,
  priority = false,
  className = '',
  style,
}: StoryImageProps) {
  if (!image) {
    return (
      <div
        aria-hidden
        className={`bg-paper-sunken flex items-center justify-center ${className}`}
      >
        <span className="text-ink-subtle/50 font-serif text-2xl">N</span>
      </div>
    );
  }

  return (
    <Image
      src={image.url}
      alt={alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
    />
  );
}
