import type { MediaSummaryDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { MediaPickerDialog } from '../media/MediaPickerDialog.js';

interface SettingsImageFieldProps {
  label: string;
  required?: boolean;
  hint: string;
  value: MediaSummaryDto | null;
  error?: string;
  onChange: (asset: MediaSummaryDto | null) => void;
  /** Marks the owning form's `touched`, so a still-empty required field shows its error. */
  onInteract?: () => void;
}

/**
 * Self-contained image picker field — owns its own dialog-open state rather
 * than the parent form owning it (as CategorySheet/AdvertisementSheet do for
 * their single image field), since three sibling instances on one page each
 * need an independent open flag.
 */
export function SettingsImageField({
  label,
  required,
  hint,
  value,
  error,
  onChange,
  onInteract,
}: SettingsImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function openPicker() {
    onInteract?.();
    setPickerOpen(true);
  }

  return (
    <div className="space-y-1.5">
      <span className="text-ink-muted block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>

      {value ? (
        <div className="border-hairline flex items-center gap-3 rounded-lg border p-3">
          <img
            src={value.url}
            alt=""
            width={64}
            height={48}
            className="h-12 w-16 shrink-0 rounded-md bg-surface-sunken object-contain"
          />
          <p className="text-ink-muted min-w-0 flex-1 truncate text-sm">
            {value.width}×{value.height}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openPicker}
          >
            Change
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Remove ${label}`}
            onClick={() => {
              onInteract?.();
              onChange(null);
            }}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className={`border-hairline bg-surface-sunken hover:border-accent hover:bg-accent-soft flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors ${error ? 'border-danger' : ''}`}
        >
          <span className="text-ink-subtle bg-surface grid size-10 shrink-0 place-items-center rounded-full">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="text-sm">
            <span className="text-ink-muted block font-medium">
              Click to upload an image
            </span>
            <span className="text-ink-subtle block text-xs">{hint}</span>
          </span>
        </button>
      )}
      {error && (
        <p role="alert" className="animate-fade-in text-danger-text text-xs">
          {error}
        </p>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        selectedId={value?.id ?? null}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => {
          onChange(
            asset
              ? {
                  id: asset.id,
                  url: asset.url,
                  width: asset.width,
                  height: asset.height,
                }
              : null,
          );
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
