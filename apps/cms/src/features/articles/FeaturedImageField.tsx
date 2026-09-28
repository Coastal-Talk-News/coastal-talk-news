import type { ImageLayoutDto, MediaSummaryDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Crop, ImagePlus, Replace, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CroppedImage } from '../media/CroppedImage.js';
import { ImageCropDialog } from '../media/ImageCropDialog.js';
import { DEFAULT_LAYOUT, placementClass } from '../media/imageFrame.js';
import { PlacementButtons } from '../media/PlacementButtons.js';
import { WidthControl } from '../media/WidthControl.js';

/** Stand-in words, so a wrapped placement shows where the text will go. */
const PLACEHOLDER_WORDS = [30, 46, 38, 54, 26, 42, 34, 50, 28, 44, 36, 48];

function PlaceholderText({ words }: { words: number }) {
  return (
    <p aria-hidden className="mt-1 leading-none">
      {Array.from({ length: words }, (_, index) => (
        <span
          key={index}
          className="bg-hairline mr-1.5 mb-2 inline-block h-2 rounded-full"
          style={{ width: PLACEHOLDER_WORDS[index % PLACEHOLDER_WORDS.length] }}
        />
      ))}
    </p>
  );
}

/** The image as the article will frame it, in a stand-in for the page's column. */
function FramePreview({
  image,
  layout,
}: {
  image: MediaSummaryDto;
  layout: ImageLayoutDto;
}) {
  return (
    <div className="bg-surface-sunken rounded-lg p-4">
      <div className="bg-surface border-hairline mx-auto flow-root max-w-xl rounded-md border p-4">
        <div
          className={placementClass(layout.placement)}
          style={{ width: `${layout.widthPercent}%` }}
        >
          <CroppedImage
            src={image.url}
            width={image.width}
            height={image.height}
            crop={layout.crop}
          />
        </div>
        <PlaceholderText
          words={layout.placement.startsWith('float') ? 60 : 30}
        />
      </div>
    </div>
  );
}

interface FeaturedImageFieldProps {
  image: MediaSummaryDto | null;
  layout: ImageLayoutDto;
  onLayoutChange: (layout: ImageLayoutDto) => void;
  onPick: () => void;
  onRemove: () => void;
}

export function FeaturedImageField({
  image,
  layout,
  onLayoutChange,
  onPick,
  onRemove,
}: FeaturedImageFieldProps) {
  const [cropOpen, setCropOpen] = useState(false);

  if (!image) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="border-hairline hover:bg-surface-sunken/70 bg-surface-sunken flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors"
      >
        <ImagePlus className="text-ink-subtle size-6" aria-hidden />
        <p className="text-ink-muted text-sm font-medium">Choose an image</p>
        <p className="text-ink-subtle text-xs">
          From the Media Library, or upload a new one.
        </p>
      </button>
    );
  }

  const set = (patch: Partial<ImageLayoutDto>) =>
    onLayoutChange({ ...layout, ...patch });
  const changed =
    layout.widthPercent !== DEFAULT_LAYOUT.widthPercent ||
    layout.placement !== DEFAULT_LAYOUT.placement ||
    layout.crop !== null;

  return (
    <div className="space-y-3">
      <FramePreview image={image} layout={layout} />
      <p className="text-ink-subtle text-xs">
        This is how the picture sits above the article. Pick a wrap option to
        let the text run beside it.
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <PlacementButtons
          value={layout.placement}
          onChange={(placement) => set({ placement })}
        />
        <WidthControl
          slider
          value={layout.widthPercent}
          onChange={(widthPercent) => set({ widthPercent })}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setCropOpen(true)}
        >
          <Crop className="size-4" aria-hidden />
          Crop
        </Button>
        {changed && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onLayoutChange(DEFAULT_LAYOUT)}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </Button>
        )}
        <span className="ml-auto flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onPick}>
            <Replace className="size-4" aria-hidden />
            Change
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden />
            Remove
          </Button>
        </span>
      </div>

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        image={image}
        crop={layout.crop}
        onApply={(crop) => set({ crop })}
      />
    </div>
  );
}
