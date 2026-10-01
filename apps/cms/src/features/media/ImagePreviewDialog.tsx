import type { MediaAssetDto } from '@coastal-talk-news/types';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface ImagePreviewDialogProps {
  asset: MediaAssetDto | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * A closer look than a grid thumbnail allows — but still the thumbnail file,
 * not the original: a second Cloudinary-transformed size would cost more
 * transformation credits for a dialog that never needs full resolution, and
 * reusing the exact URL the grid already loaded usually means the browser
 * serves this from its own cache rather than fetching anything at all.
 */
export function ImagePreviewDialog({
  asset,
  onOpenChange,
}: ImagePreviewDialogProps) {
  return (
    <Dialog.Root open={asset !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content className="data-[state=open]:animate-rise bg-surface fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl shadow-2xl">
          {asset && (
            <>
              <Dialog.Title className="sr-only">{asset.filename}</Dialog.Title>
              <Dialog.Description className="sr-only">
                A full-size preview of {asset.filename}.
              </Dialog.Description>

              <div className="bg-surface-sunken flex max-h-[65vh] items-center justify-center overflow-hidden">
                <img
                  src={asset.thumbnailUrl}
                  alt=""
                  className="max-h-[65vh] max-w-full object-contain"
                />
              </div>

              <Dialog.Close
                aria-label="Close"
                className="text-ink bg-surface/90 hover:bg-surface absolute top-3 right-3 rounded-lg p-1.5 shadow-sm backdrop-blur-sm transition-colors"
              >
                <X className="size-4" aria-hidden />
              </Dialog.Close>

              <div className="border-hairline flex items-center justify-between gap-3 border-t px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-medium">
                    {asset.filename}
                  </p>
                  <p className="text-ink-subtle mt-0.5 text-xs">
                    {asset.width}×{asset.height} · {formatBytes(asset.fileSize)}
                  </p>
                </div>
                <span
                  className={
                    asset.usage.total > 0
                      ? 'text-success-text shrink-0 text-xs font-medium'
                      : 'text-ink-subtle shrink-0 text-xs'
                  }
                >
                  {asset.usage.total > 0
                    ? `Used in ${asset.usage.total} place${asset.usage.total === 1 ? '' : 's'}`
                    : 'Not used'}
                </span>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
