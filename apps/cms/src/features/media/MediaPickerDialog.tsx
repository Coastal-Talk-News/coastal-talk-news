import type { MediaAssetDto } from '@coastal-talk-news/types';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@coastal-talk-news/ui/button';
import { Input } from '@coastal-talk-news/ui/input';
import { Skeleton } from '@coastal-talk-news/ui/skeleton';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { Image as ImageIcon, Search, X } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/client.js';
import { useDebounced } from '../../lib/useDebounced.js';
import { MediaGrid } from './MediaGrid.js';
import { UploadZone } from './UploadZone.js';
import { useMediaLibrary } from './useMediaLibrary.js';

interface MediaPickerDialogProps {
  open: boolean;
  selectedId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAssetDto | null) => void;
}

export function MediaPickerDialog({
  open,
  selectedId,
  onOpenChange,
  onSelect,
}: MediaPickerDialogProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const { listQuery, pending, enqueueFiles, retryUpload, dismissUpload } =
    useMediaLibrary(debouncedSearch);
  const { data, isPending, isError, error, refetch } = listQuery;

  const assets = data?.data ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content className="data-[state=open]:animate-rise bg-surface fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl shadow-2xl">
          <div className="border-hairline flex items-start justify-between border-b px-6 py-5">
            <div>
              <Dialog.Title className="text-ink text-lg font-semibold">
                Choose an image
              </Dialog.Title>
              <Dialog.Description className="text-ink-muted mt-0.5 text-sm">
                Pick from the library, or upload a new one.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="text-ink-muted hover:bg-surface-sunken hover:text-ink -mr-2 rounded-lg p-2 transition-colors"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>

          <div className="space-y-4 overflow-y-auto px-6 py-5">
            <UploadZone
              // Selecting straight after upload saves a second click on what
              // is almost always the image the admin just added.
              onFiles={(files) =>
                enqueueFiles(files, (asset) => onSelect(asset))
              }
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by file name…"
              aria-label="Search media"
              icon={<Search className="size-4" aria-hidden />}
            />

            {isPending && pending.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="aspect-4/3 rounded-xl" />
                ))}
              </div>
            ) : isError ? (
              <ErrorState
                message={
                  error instanceof ApiError
                    ? error.message
                    : 'Could not load your media.'
                }
                onRetry={() => void refetch()}
              />
            ) : assets.length === 0 && pending.length === 0 ? (
              <EmptyState
                icon={<ImageIcon className="size-5" aria-hidden />}
                title={debouncedSearch ? 'No matching images' : 'No images yet'}
                description={
                  debouncedSearch
                    ? 'Try a different file name.'
                    : 'Upload one above to use it here.'
                }
              />
            ) : (
              <MediaGrid
                assets={assets}
                pending={pending}
                onRetryPending={retryUpload}
                onDismissPending={dismissUpload}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            )}
          </div>

          <div className="border-hairline bg-surface-sunken flex justify-between gap-3 border-t px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => onSelect(null)}
              disabled={!selectedId}
            >
              Remove image
            </Button>
            <Dialog.Close asChild>
              <Button variant="secondary">Done</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
