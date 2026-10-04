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
  /** Top ads only, and only when the admin explicitly picks "Fit, soft
   *  background" for that ad (see AdFitMode) - a softly blurred, enlarged
   *  copy of the same image behind it, for whichever corners the creative
   *  itself doesn't reach. Every other placement, and every other Top ad's
   *  own choice, leaves that space exactly as the admin picked instead:
   *  this is never applied unless asked for. */
  backdrop?: boolean;
}

/**
 * An ad slot that names itself while the creative loads, so the space reads
 * as a held advertising slot rather than as a broken or empty patch.
 *
 * Whichever framing the CMS set is drawn exactly as chosen - cropped to
 * fill, or the whole creative - never adjusted here.
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
  backdrop = false,
}: AdImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {backdrop && (
        <Image
          aria-hidden
          alt=""
          src={image.url}
          fill
          sizes={sizes}
          className="scale-125 object-cover blur-2xl"
        />
      )}
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
        className={`${className} relative transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </span>
  );
}
