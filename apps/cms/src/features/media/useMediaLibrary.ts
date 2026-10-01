import type { ApiListSuccess, MediaAssetDto } from '@coastal-talk-news/types';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../../api/client.js';
import { mediaApi } from '../../api/media.js';
import { queryKeys } from '../../api/queryKeys.js';

type MediaPage = ApiListSuccess<MediaAssetDto>;
interface MediaPages {
  pages: MediaPage[];
  pageParams: number[];
}

/** Small on purpose: loading the whole library in one request is exactly the
 *  slow-page, wasted-bandwidth problem infinite scroll exists to avoid. */
const PAGE_SIZE = 10;

export interface PendingUpload {
  key: string;
  file: File;
  previewUrl: string;
  percent: number;
  status: 'uploading' | 'error';
  error?: string;
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Every page rebuilt with `map` applied to its assets, and a fresh total. */
function withMappedAssets(
  data: MediaPages | undefined,
  map: (assets: MediaAssetDto[]) => MediaAssetDto[],
): MediaPages | undefined {
  if (!data) return data;
  const pages = data.pages.map((page) => ({ ...page, data: map(page.data) }));
  const total = pages.reduce((sum, page) => sum + page.data.length, 0);
  return {
    ...data,
    pages: pages.map((page, index) =>
      index === 0 ? { ...page, meta: { ...page.meta, total } } : page,
    ),
  };
}

export function useMediaLibrary(search: string) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const listKey = queryKeys.mediaList({ search: search || undefined });
  const listQuery = useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam, signal }) =>
      mediaApi.list(
        { page: pageParam, limit: PAGE_SIZE, ...(search ? { search } : {}) },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });

  const assets = listQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const total = listQuery.data?.pages[0]?.meta.total ?? 0;

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.media });
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
  }, [queryClient]);

  useEffect(() => {
    return () => {
      for (const upload of pendingRef.current)
        URL.revokeObjectURL(upload.previewUrl);
    };
  }, []);

  const runUpload = useCallback(
    (key: string, file: File, onUploaded?: (asset: MediaAssetDto) => void) => {
      mediaApi
        .uploadOne(file, (percent) => {
          setPending((current) =>
            current.map((upload) =>
              upload.key === key ? { ...upload, percent } : upload,
            ),
          );
        })
        .then((asset) => {
          setPending((current) => {
            const upload = current.find((item) => item.key === key);
            if (upload) URL.revokeObjectURL(upload.previewUrl);
            return current.filter((item) => item.key !== key);
          });
          // A fresh upload belongs at the front of an unfiltered library; a
          // search in progress may not even match it, so it's left for the
          // next real fetch rather than guessed at here.
          if (!search) {
            queryClient.setQueryData<MediaPages>(listKey, (current) => {
              if (!current || current.pages.length === 0) return current;
              const [first, ...rest] = current.pages;
              if (!first) return current;
              return {
                ...current,
                pages: [
                  {
                    ...first,
                    data: [asset, ...first.data],
                    meta: { ...first.meta, total: first.meta.total + 1 },
                  },
                  ...rest,
                ],
              };
            });
          }
          invalidate();
          toast.success(`${asset.filename} uploaded.`);
          onUploaded?.(asset);
        })
        .catch((error: unknown) => {
          setPending((current) =>
            current.map((upload) =>
              upload.key === key
                ? {
                    ...upload,
                    status: 'error',
                    error: messageFor(error, 'Upload failed.'),
                  }
                : upload,
            ),
          );
        });
    },
    [invalidate, listKey, queryClient, search],
  );

  const enqueueFiles = useCallback(
    (files: File[], onUploaded?: (asset: MediaAssetDto) => void) => {
      for (const file of files) {
        const key = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        setPending((current) => [
          ...current,
          { key, file, previewUrl, percent: 0, status: 'uploading' },
        ]);
        runUpload(key, file, onUploaded);
      }
    },
    [runUpload],
  );

  const retryUpload = useCallback(
    (key: string) => {
      const upload = pendingRef.current.find((item) => item.key === key);
      if (!upload) return;
      setPending((current) =>
        current.map((item) =>
          item.key === key
            ? { ...item, status: 'uploading', percent: 0, error: undefined }
            : item,
        ),
      );
      runUpload(key, upload.file);
    },
    [runUpload],
  );

  const dismissUpload = useCallback((key: string) => {
    setPending((current) => {
      const upload = current.find((item) => item.key === key);
      if (upload) URL.revokeObjectURL(upload.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  }, []);

  const remove = useMutation({
    mutationFn: (asset: MediaAssetDto) => mediaApi.remove(asset.id),
    onMutate: async (asset) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<MediaPages>(listKey);
      queryClient.setQueryData<MediaPages>(listKey, (current) =>
        withMappedAssets(current, (items) =>
          items.filter((item) => item.id !== asset.id),
        ),
      );
      return { previous };
    },
    onSuccess: (_result, asset) => toast.success(`${asset.filename} deleted.`),
    onError: (error, _asset, context) => {
      if (context?.previous)
        queryClient.setQueryData(listKey, context.previous);
      toast.error(messageFor(error, 'Could not delete this image.'));
    },
    onSettled: invalidate,
  });

  const cleanup = useMutation({
    mutationFn: () => mediaApi.cleanup(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<MediaPages>(listKey);
      queryClient.setQueryData<MediaPages>(listKey, (current) =>
        withMappedAssets(current, (items) =>
          items.filter((item) => item.usage.total > 0),
        ),
      );
      return { previous };
    },
    onSuccess: ({ removed }) => {
      toast.success(
        removed === 0
          ? 'Nothing to clean up — every image is in use.'
          : `Removed ${removed} unused image${removed === 1 ? '' : 's'}.`,
      );
    },
    onError: (_error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(listKey, context.previous);
      toast.error('Could not clean up unused images.');
    },
    onSettled: invalidate,
  });

  return {
    listQuery,
    assets,
    total,
    pending,
    enqueueFiles,
    retryUpload,
    dismissUpload,
    remove,
    cleanup,
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
  };
}
