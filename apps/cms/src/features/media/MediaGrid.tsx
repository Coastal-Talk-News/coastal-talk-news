import type { MediaAssetDto } from '@coastal-talk-news/types';
import { cn } from '@coastal-talk-news/ui/cn';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import {
  AlertCircle,
  Check,
  Eye,
  Loader2,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useInfiniteScrollSentinel } from '../../lib/useInfiniteScrollSentinel.js';
import { ImagePreviewDialog } from './ImagePreviewDialog.js';
import type { PendingUpload } from './useMediaLibrary.js';

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function usageLabel(asset: MediaAssetDto): string {
  const { total } = asset.usage;
  if (total === 0) return 'Not used';
  return `Used in ${total} place${total === 1 ? '' : 's'}`;
}

interface MediaGridProps {
  assets: MediaAssetDto[];
  pending?: PendingUpload[];
  onRetryPending?: (key: string) => void;
  onDismissPending?: (key: string) => void;
  onDelete?: (asset: MediaAssetDto) => void;
  onSelect?: (asset: MediaAssetDto) => void;
  selectedId?: string | null;
  /** More rows exist past what's loaded; scrolling near the end fetches them. */
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** The scrollable ancestor to watch for "near the end" — omit for the page
   *  itself (a dialog's own scrolling panel needs its own element here). */
  scrollRoot?: HTMLElement | null;
}

export function MediaGrid({
  assets,
  pending = [],
  onRetryPending,
  onDismissPending,
  onDelete,
  onSelect,
  selectedId,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  scrollRoot,
}: MediaGridProps) {
  const selectable = Boolean(onSelect);
  const [previewAsset, setPreviewAsset] = useState<MediaAssetDto | null>(null);
  const sentinelRef = useInfiniteScrollSentinel(() => onLoadMore?.(), {
    enabled: hasNextPage && !isFetchingNextPage,
    root: scrollRoot,
  });

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pending.map((upload) => (
          <li key={upload.key}>
            <div className="border-hairline bg-surface relative overflow-hidden rounded-xl border">
              <div className="bg-surface-sunken block aspect-4/3 w-full overflow-hidden">
                <img
                  src={upload.previewUrl}
                  alt=""
                  className={cn(
                    'size-full object-cover',
                    upload.status === 'uploading' ? 'opacity-40' : 'opacity-20',
                  )}
                />
              </div>

              {upload.status === 'uploading' ? (
                <>
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="bg-surface/90 text-ink rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                      {upload.percent}%
                    </span>
                  </div>
                  <div className="bg-hairline absolute bottom-0 left-0 h-1 w-full">
                    <div
                      className="bg-accent h-full transition-[width] duration-200"
                      style={{ width: `${upload.percent}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
                  <AlertCircle
                    className="text-danger-text size-5"
                    aria-hidden
                  />
                  <p className="text-danger-text text-[11px] leading-tight">
                    {upload.error ?? 'Upload failed.'}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRetryPending?.(upload.key)}
                      className="bg-surface text-ink-muted hover:text-ink flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium shadow-sm"
                    >
                      <RotateCw className="size-3" aria-hidden />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissPending?.(upload.key)}
                      className="bg-surface text-ink-muted hover:text-ink flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium shadow-sm"
                    >
                      <X className="size-3" aria-hidden />
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div className="px-3 py-2">
                <p
                  className="text-ink truncate text-xs font-medium"
                  title={upload.file.name}
                >
                  {upload.file.name}
                </p>
                <p className="text-ink-subtle mt-0.5 text-[11px]">
                  {upload.status === 'uploading' ? 'Uploading…' : 'Failed'}
                </p>
              </div>
            </div>
          </li>
        ))}

        {assets.map((asset) => {
          const selected = selectedId === asset.id;
          const inUse = asset.usage.total > 0;

          return (
            <li key={asset.id}>
              <div
                className={cn(
                  'group border-hairline bg-surface relative overflow-hidden rounded-xl border',
                  'transition-shadow duration-200 hover:shadow-md',
                  selected && 'ring-accent ring-2',
                )}
              >
                <button
                  type="button"
                  // Selecting is the main click in a picker; without that,
                  // there's nothing else a click on the thumbnail would do
                  // besides preview it.
                  onClick={() =>
                    selectable ? onSelect?.(asset) : setPreviewAsset(asset)
                  }
                  className="bg-surface-sunken block aspect-4/3 w-full cursor-pointer"
                >
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.filename}
                    loading="lazy"
                    width={asset.width}
                    height={asset.height}
                    className="size-full object-cover"
                  />
                </button>

                {selected && (
                  <span className="bg-accent text-accent-fg absolute top-2 left-2 grid size-6 place-items-center rounded-full">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}

                <span className="absolute top-2 right-2 flex gap-1.5">
                  {selectable && (
                    <Tooltip label="Preview">
                      <button
                        type="button"
                        onClick={() => setPreviewAsset(asset)}
                        aria-label={`Preview ${asset.filename}`}
                        className="text-ink-muted bg-surface/90 hover:text-ink grid size-8 place-items-center rounded-lg opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Eye className="size-4" aria-hidden />
                      </button>
                    </Tooltip>
                  )}

                  {onDelete && (
                    <Tooltip
                      label={
                        inUse
                          ? `In use — remove it from ${usageLabel(asset).toLowerCase().replace('used in ', '')} first`
                          : 'Delete'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onDelete(asset)}
                        disabled={inUse}
                        aria-label={`Delete ${asset.filename}`}
                        className={cn(
                          'text-danger-text bg-surface/90 grid size-8 place-items-center rounded-lg opacity-0 backdrop-blur-sm transition',
                          'group-hover:opacity-100 focus-visible:opacity-100',
                          'hover:bg-danger-soft disabled:cursor-not-allowed disabled:text-ink-subtle',
                        )}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </Tooltip>
                  )}
                </span>

                <div className="px-3 py-2">
                  <p
                    className="text-ink truncate text-xs font-medium"
                    title={asset.filename}
                  >
                    {asset.filename}
                  </p>
                  <p className="text-ink-subtle mt-0.5 text-[11px]">
                    {asset.width}×{asset.height} · {formatBytes(asset.fileSize)}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-[11px]',
                      inUse ? 'text-success-text' : 'text-ink-subtle',
                    )}
                  >
                    {usageLabel(asset)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {(hasNextPage || isFetchingNextPage) && (
        <div
          ref={sentinelRef}
          className="text-ink-subtle flex items-center justify-center gap-2 py-6 text-xs"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading more…
        </div>
      )}

      <ImagePreviewDialog
        asset={previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
      />
    </>
  );
}
