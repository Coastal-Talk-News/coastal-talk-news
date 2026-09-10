import type { MediaAssetDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Input } from '@coastal-talk-news/ui/input';
import { Skeleton } from '@coastal-talk-news/ui/skeleton';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { Image as ImageIcon, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../api/client.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { MediaGrid } from '../features/media/MediaGrid.js';
import { UploadZone } from '../features/media/UploadZone.js';
import { useMediaLibrary } from '../features/media/useMediaLibrary.js';
import { useDebounced } from '../lib/useDebounced.js';

export function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [pendingDelete, setPendingDelete] = useState<MediaAssetDto | null>(
    null,
  );
  const [confirmCleanup, setConfirmCleanup] = useState(false);

  const {
    listQuery,
    pending,
    enqueueFiles,
    retryUpload,
    dismissUpload,
    remove,
    cleanup,
  } = useMediaLibrary(debouncedSearch);
  const { data, isPending, isError, error, refetch } = listQuery;

  const assets = data?.data ?? [];
  const unusedCount = assets.filter((asset) => asset.usage.total === 0).length;

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Media"
        description="Images used across articles, categories, advertisements and settings."
        actions={
          <Button
            variant="secondary"
            onClick={() => setConfirmCleanup(true)}
            disabled={unusedCount === 0}
          >
            <Sparkles className="size-4" aria-hidden />
            Clean up unused
          </Button>
        }
      />

      <div className="space-y-5">
        <UploadZone onFiles={(files) => enqueueFiles(files)} />

        <section className="border-hairline rounded-card bg-surface overflow-hidden border shadow-sm">
          <div className="border-hairline flex flex-wrap items-center gap-3 border-b p-4">
            <div className="min-w-56 flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by file name…"
                aria-label="Search media"
                icon={<Search className="size-4" aria-hidden />}
              />
            </div>
            {data && (
              <p className="text-ink-muted text-xs">
                {data.meta.total} image{data.meta.total === 1 ? '' : 's'}
                {unusedCount > 0 && ` · ${unusedCount} unused`}
              </p>
            )}
          </div>

          <div className="p-4">
            {isPending && pending.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }, (_, index) => (
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
                    : 'Upload an image to get started.'
                }
              />
            ) : (
              <MediaGrid
                assets={assets}
                pending={pending}
                onRetryPending={retryUpload}
                onDismissPending={dismissUpload}
                onDelete={setPendingDelete}
              />
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.filename}?`}
        description="This permanently removes the image. It cannot be undone."
        confirmLabel="Delete image"
        onConfirm={() => {
          if (!pendingDelete) return;
          // Optimistic: rolled back with a toast if the server rejects it.
          remove.mutate(pendingDelete);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={confirmCleanup}
        onOpenChange={setConfirmCleanup}
        title="Remove unused images?"
        description={`This deletes ${unusedCount} image${unusedCount === 1 ? '' : 's'} that nothing references. Images in use are kept.`}
        confirmLabel="Remove them"
        onConfirm={() => {
          cleanup.mutate();
          setConfirmCleanup(false);
        }}
      />
    </>
  );
}
