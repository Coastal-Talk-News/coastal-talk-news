'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import type { MediaSummaryDto } from '@coastal-talk-news/types';

interface AdImageProps {
  image: MediaSummaryDto;
  alt: string;
  sizes: string;
  /** Localised word shown in the slot until the creative paints. */
  label: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** The slot this sits in, so the loading word stays legible on it. */
  tone?: 'light' | 'dark';
}

/**
 * An ad slot that names itself while the creative loads, so the space reads
 * as a held advertising slot rather than as a broken or empty patch.
 */
export function AdImage({
  image,
  alt,
  sizes,
  label,
  priority = false,
  className = '',
  style,
  tone = 'light',
}: AdImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className="relative flex h-full w-full items-center justify-center">
      {!loaded && (
        <span
          aria-hidden
          className={`absolute inset-0 grid place-items-center text-[10px] font-semibold tracking-[0.25em] uppercase ${
            tone === 'dark' ? 'text-white/45' : 'text-ink-subtle/60'
          }`}
        >
          {label}
        </span>
      )}
      <Image
        src={image.url}
        alt={alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        style={style}
        className={`${className} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </span>
  );
}
