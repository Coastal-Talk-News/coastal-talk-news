import { Button } from '@coastal-talk-news/ui/button';
import { IMAGE_DEFAULT_WIDTH_PERCENT } from '@coastal-talk-news/validation/limits';
import type { Editor } from '@tiptap/react';
import { Crop, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ImageCropDialog } from '../../features/media/ImageCropDialog.js';
import { PlacementButtons } from '../../features/media/PlacementButtons.js';
import { WidthControl } from '../../features/media/WidthControl.js';
import { Divider } from './ToolbarButton.js';
import type { ImageAttrs } from './imageAttrs.js';

/**
 * The controls for the picture the cursor is on. They sit in a row under the
 * main toolbar, like the link bar, so they never cover the picture and are
 * always in the same place.
 */
export function ImageBar({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes('image') as ImageAttrs;
  const [cropOpen, setCropOpen] = useState(false);

  function set(patch: Partial<ImageAttrs>) {
    editor.chain().focus().updateAttributes('image', patch).run();
  }

  // A picture from outside the library has no known size to crop against.
  const original =
    attrs.mediaId && attrs.src && attrs.naturalWidth && attrs.naturalHeight
      ? {
          url: attrs.src,
          width: attrs.naturalWidth,
          height: attrs.naturalHeight,
        }
      : null;

  return (
    <div className="border-hairline bg-surface-sunken flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-2 py-1.5">
      <span className="text-ink-muted px-1 text-xs font-medium">Image</span>
      <PlacementButtons
        value={attrs.placement ?? 'center'}
        onChange={(placement) => set({ placement })}
      />
      <Divider />
      <WidthControl
        value={attrs.widthPercent ?? IMAGE_DEFAULT_WIDTH_PERCENT}
        onChange={(widthPercent) => set({ widthPercent })}
      />
      <Divider />
      {original && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setCropOpen(true)}
        >
          <Crop className="size-4" aria-hidden />
          Crop
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() =>
          set({
            widthPercent: IMAGE_DEFAULT_WIDTH_PERCENT,
            placement: 'center',
            crop: null,
          })
        }
      >
        <RotateCcw className="size-4" aria-hidden />
        Reset
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-danger-text ml-auto"
        onClick={() => editor.chain().focus().deleteSelection().run()}
      >
        <Trash2 className="size-4" aria-hidden />
        Remove
      </Button>

      {original && (
        <ImageCropDialog
          open={cropOpen}
          onOpenChange={setCropOpen}
          image={original}
          crop={attrs.crop}
          onApply={(crop) => set({ crop })}
        />
      )}
    </div>
  );
}
