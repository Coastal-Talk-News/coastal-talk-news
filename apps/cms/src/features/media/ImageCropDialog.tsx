import type { ImageCrop } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { IMAGE_CROP_MIN_FRACTION } from '@coastal-talk-news/validation/limits';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Picture {
  url: string;
  width: number;
  height: number;
}

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: Picture;
  /** Null when the whole picture is showing. */
  crop: ImageCrop | null;
  onApply: (crop: ImageCrop | null) => void;
}

const WHOLE: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };

function toPercent(crop: ImageCrop | null): PercentCrop {
  return crop
    ? {
        unit: '%',
        x: crop.x * 100,
        y: crop.y * 100,
        width: crop.width * 100,
        height: crop.height * 100,
      }
    : WHOLE;
}

function toFractions(crop: PercentCrop): ImageCrop | null {
  const round = (percent: number) => Math.round(percent * 100) / 10000;
  const x = round(crop.x);
  const y = round(crop.y);
  const width = Math.min(round(crop.width), 1 - x);
  const height = Math.min(round(crop.height), 1 - y);
  // Covering everything is the same as not cropping, and stores nothing.
  return x === 0 && y === 0 && width >= 0.999 && height >= 0.999
    ? null
    : { x, y, width, height };
}

const RATIOS = [
  { label: 'Free', ratio: undefined },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '16:9', ratio: 16 / 9 },
];

function CropEditor({
  image,
  crop: initial,
  onApply,
  onCancel,
}: Omit<ImageCropDialogProps, 'open' | 'onOpenChange'> & {
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<PercentCrop>(toPercent(initial));
  const [ratio, setRatio] = useState<number | undefined>(undefined);

  function pickRatio(next: number | undefined) {
    setRatio(next);
    if (next) {
      setCrop(
        centerCrop(
          makeAspectCrop(
            { unit: '%', width: 90 },
            next,
            image.width,
            image.height,
          ),
          image.width,
          image.height,
        ),
      );
    }
  }

  const fractions = toFractions(crop);
  const kept = fractions ?? { x: 0, y: 0, width: 1, height: 1 };
  const tooSmall =
    kept.width < IMAGE_CROP_MIN_FRACTION ||
    kept.height < IMAGE_CROP_MIN_FRACTION;

  return (
    <>
      <div className="bg-surface-sunken flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        <ReactCrop
          crop={crop}
          aspect={ratio}
          keepSelection
          onChange={(_, percent) => setCrop(percent)}
        >
          <img
            src={image.url}
            alt="Image being cropped"
            className="block max-h-[55vh] max-w-full"
            draggable={false}
          />
        </ReactCrop>
      </div>

      <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Crop shape"
        >
          {RATIOS.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={ratio === option.ratio}
              onClick={() => pickRatio(option.ratio)}
              className={cn(
                'h-8 rounded-md px-2.5 text-xs font-medium transition-colors',
                ratio === option.ratio
                  ? 'bg-accent-soft text-accent-text'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-ink-subtle text-xs tabular-nums">
          {Math.round(kept.width * image.width)} ×{' '}
          {Math.round(kept.height * image.height)} px
        </p>
      </div>

      <div className="border-hairline flex items-center justify-between gap-2 border-t px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          disabled={!fractions && !initial}
          onClick={() => {
            setRatio(undefined);
            setCrop(WHOLE);
          }}
        >
          Show whole image
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={tooSmall}
            onClick={() => onApply(fractions)}
          >
            Apply crop
          </Button>
        </div>
      </div>
    </>
  );
}

export function ImageCropDialog({
  open,
  onOpenChange,
  ...editor
}: ImageCropDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content className="data-[state=open]:animate-rise bg-surface fixed top-1/2 left-1/2 z-50 flex max-h-[92vh] w-[min(52rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl shadow-2xl">
          <div className="flex items-start justify-between px-6 py-5">
            <div>
              <Dialog.Title className="text-ink text-lg font-semibold">
                Crop image
              </Dialog.Title>
              <Dialog.Description className="text-ink-muted mt-0.5 text-sm">
                Drag the edges to choose the part to show. The original stays in
                the library.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="text-ink-muted hover:bg-surface-sunken hover:text-ink -mr-2 rounded-lg p-2 transition-colors"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <CropEditor
            {...editor}
            onCancel={() => onOpenChange(false)}
            onApply={(crop) => {
              editor.onApply(crop);
              onOpenChange(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
