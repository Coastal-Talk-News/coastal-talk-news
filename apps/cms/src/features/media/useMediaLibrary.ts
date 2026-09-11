import type { ApiListSuccess, MediaAssetDto } from '@coastal-talk-news/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../../api/client.js';
import { mediaApi } from '../../api/media.js';
import { queryKeys } from '../../api/queryKeys.js';

type MediaList = ApiListSuccess<MediaAssetDto>;

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

export function useMediaLibrary(search: string) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const params = { limit: 60, ...(search ? { search } : {}) };
  const listKey = queryKeys.mediaList(params);
  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => mediaApi.list(params, signal),
  });

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
          if (!search) {
            queryClient.setQueryData<MediaList>(listKey, (current) =>
              current
                ? {
                    ...current,
                    data: [asset, ...current.data],
                    meta: { ...current.meta, total: current.meta.total + 1 },
                  }
                : current,
            );
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
      const previous = queryClient.getQueryData<MediaList>(listKey);
      queryClient.setQueryData<MediaList>(listKey, (current) =>
        current
          ? {
              ...current,
              data: current.data.filter((item) => item.id !== asset.id),
              meta: {
                ...current.meta,
                total: Math.max(0, current.meta.total - 1),
              },
            }
          : current,
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
      const previous = queryClient.getQueryData<MediaList>(listKey);
      queryClient.setQueryData<MediaList>(listKey, (current) => {
        if (!current) return current;
        const kept = current.data.filter((item) => item.usage.total > 0);
        return {
          ...current,
          data: kept,
          meta: { ...current.meta, total: kept.length },
        };
      });
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
    pending,
    enqueueFiles,
    retryUpload,
    dismissUpload,
    remove,
    cleanup,
  };
}
