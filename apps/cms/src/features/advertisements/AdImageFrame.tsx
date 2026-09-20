import type { AdImageCrop, MediaSummaryDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ZOOM_MAX, ZOOM_MIN, clampCrop, coverZoom } from './crop.js';

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

  const filled = coverZoom(image, slot);

  return (
    <div className="space-y-2">
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
          aspectRatio: `${slot.width} / ${slot.height}`,
          maxWidth: slot.width,
        }}
      >
        <img
          src={image.url}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full object-contain"
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
