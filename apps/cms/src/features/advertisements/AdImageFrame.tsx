import type {
  AdFitMode,
  AdImageCrop,
  MediaSummaryDto,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  ZOOM_MAX,
  ZOOM_MIN,
  clampCrop,
  coverZoom,
  visibleAdBox,
} from './crop.js';
import { FIT_MODE_OPTIONS } from './placement.js';

export interface AdSlot {
  width: number;
  height: number;
}

const NUDGE = 2;

interface AdImageFrameProps {
  image: MediaSummaryDto;
  /** The reader-site slot, at its real size - this is a true preview. */
  slot: AdSlot;
  crop: AdImageCrop;
  onChange: (crop: AdImageCrop) => void;
  /**
   * Masthead and Top ads only. When set, this frame also offers the
   * three-way choice of what happens to whatever the crop above doesn't
   * cover - independent of the crop itself, which works exactly the same
   * as it does for every other placement. Sidebar never passes this - it
   * sets width alone and lets height follow the artwork, so there's never
   * a gap to resolve.
   */
  fitMode?: AdFitMode;
  onFitModeChange?: (mode: AdFitMode) => void;
}

/**
 * The slot's size is what the advertiser paid for, so it never moves. What
 * this sets is where the artwork sits inside it: drag to move, zoom to fill,
 * the way a profile-picture cropper works. Whatever leaves the frame is what
 * readers won't see.
 */
export function AdImageFrame({
  image,
  slot,
  crop,
  onChange,
  fitMode,
  onFitModeChange,
}: AdImageFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; crop: AdImageCrop } | null>(null);
  const [dragging, setDragging] = useState(false);

  function apply(next: AdImageCrop) {
    onChange(clampCrop(next, image, slot));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, crop };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const frame = frameRef.current?.getBoundingClientRect();
    if (!start || !frame) return;
    // The frame can be drawn narrower than the slot on a small screen, so a
    // drag is measured against what is on screen, not against the slot size.
    apply({
      ...start.crop,
      offsetX:
        start.crop.offsetX + ((event.clientX - start.x) / frame.width) * 100,
      offsetY:
        start.crop.offsetY + ((event.clientY - start.y) / frame.height) * 100,
    });
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    apply({
      ...crop,
      offsetX: crop.offsetX + move[0],
      offsetY: crop.offsetY + move[1],
    });
  }

  // Both are legitimate, deliberate choices - showing the whole creative
  // uncropped, or filling the slot exactly - not one "correct" default the
  // admin has to override. Which one the advertiser needs depends on the
  // artwork: a logo or anything with text near its edges often can't survive
  // being cropped to fill an odd-shaped slot, so "whole image" has to stay a
  // real, equally-supported option, not something this component decides on
  // their behalf. Zoom is otherwise free between the two, same for every
  // fit mode below - it is never gated behind any of them.
  const filled = coverZoom(image, slot);

  const hasFitMode = fitMode !== undefined && onFitModeChange !== undefined;
  // FIT_SHRINK's box always matches what is actually visible at the current
  // zoom - at zoom 100 that's the plain contained image; past coverZoom
  // there's no gap left to shrink away, so this is just the slot itself.
  const box =
    hasFitMode && fitMode === 'FIT_SHRINK'
      ? visibleAdBox(image, slot, crop.zoom)
      : slot;

  return (
    <div className="space-y-2">
      {hasFitMode && (
        <div className="space-y-1.5">
          <span className="text-ink-muted block text-sm font-medium">
            Leftover space
          </span>
          <div className="grid grid-cols-3 gap-2">
            {FIT_MODE_OPTIONS.map((option) => {
              const selected = fitMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onFitModeChange?.(option.value)}
                  className={cn(
                    'rounded-lg border p-2 text-left text-xs transition-colors',
                    selected
                      ? 'border-accent bg-accent-soft'
                      : 'border-hairline hover:border-ink-subtle/40',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-ink-subtle text-xs">
            {FIT_MODE_OPTIONS.find((option) => option.value === fitMode)
              ?.hint ?? ''}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-ink-muted text-sm font-medium">
          Image placement
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => apply({ zoom: 100, offsetX: 0, offsetY: 0 })}
          >
            Whole image
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => apply({ zoom: filled, offsetX: 0, offsetY: 0 })}
          >
            Fill slot
          </Button>
        </div>
      </div>

      <div
        ref={frameRef}
        role="group"
        aria-label="Advertisement preview"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={cn(
          // The reader site's paper rather than the CMS's dark surface: with
          // the whole image in view, the rest of the slot is what readers
          // actually see beside it.
          'border-hairline focus-visible:ring-accent relative w-full overflow-hidden rounded-lg border bg-[#faf9f6] select-none focus:outline-none focus-visible:ring-2',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        style={{
          aspectRatio: `${box.width} / ${box.height}`,
          maxWidth: box.width,
        }}
      >
        {hasFitMode && fitMode === 'FIT_BACKGROUND' && (
          <img
            src={image.url}
            alt=""
            draggable={false}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
          />
        )}
        <img
          src={image.url}
          alt=""
          draggable={false}
          className="pointer-events-none relative h-full w-full object-contain"
          style={{
            transform: `translate(${crop.offsetX}%, ${crop.offsetY}%) scale(${crop.zoom / 100})`,
          }}
        />
      </div>

      <div
        className="flex w-full items-center gap-3"
        style={{ maxWidth: slot.width }}
      >
        <label className="text-ink-subtle text-xs" htmlFor="advertisement-zoom">
          Zoom
        </label>
        <input
          id="advertisement-zoom"
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          value={crop.zoom}
          onChange={(event) =>
            apply({ ...crop, zoom: Number(event.target.value) })
          }
          className="accent-accent h-1 min-w-0 flex-1 cursor-pointer"
        />
        <span className="text-ink-subtle w-10 text-right text-xs tabular-nums">
          {crop.zoom}%
        </span>
      </div>

      <p className="text-ink-muted text-xs">
        Drag the image to move it, or use the arrow keys. The frame is the
        advertisement&rsquo;s space on the website, in the shape readers see it
        — anything outside it is cropped.
      </p>
    </div>
  );
}
