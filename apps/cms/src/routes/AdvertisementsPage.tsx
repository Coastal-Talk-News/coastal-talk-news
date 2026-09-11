import type {
  AdvertisementDto,
  CreateAdvertisementRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Select, type SelectOption } from '@coastal-talk-news/ui/select';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Megaphone, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { advertisementsApi } from '../api/advertisements.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { AdvertisementRow } from '../features/advertisements/AdvertisementRow.js';
import { AdvertisementSheet } from '../features/advertisements/AdvertisementSheet.js';
import { AdvertisementTableSkeleton } from '../features/advertisements/AdvertisementTableSkeleton.js';
import {
  advertisementStatusValue,
  type AdvertisementStatus,
} from '../features/advertisements/status.js';
import { useAdvertisementMutations } from '../features/advertisements/useAdvertisementMutations.js';

type StatusFilter = 'all' | AdvertisementStatus;
type SortOrder = 'newest' | 'oldest';

const STATUS_OPTIONS: Array<SelectOption<StatusFilter>> = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

const SORT_OPTIONS: Array<SelectOption<SortOrder>> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

const LIST_PARAMS = { limit: 100 };

const CLOCK_TICK_MS = 15_000;

export function AdvertisementsPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdvertisementDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdvertisementDto | null>(
    null,
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const listKey = queryKeys.advertisementList(LIST_PARAMS);
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => advertisementsApi.list(LIST_PARAMS, signal),
  });

  const mutations = useAdvertisementMutations();
  const items = data?.data ?? [];

  const visible = useMemo(() => {
    const filtered =
      status === 'all'
        ? items
        : items.filter(
            (item) => advertisementStatusValue(item, now) === status,
          );

    return [...filtered].sort((a, b) => {
      const delta =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === 'newest' ? delta : -delta;
    });
  }, [items, status, sort, now]);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(item: AdvertisementDto) {
    setEditing(item);
    setSheetOpen(true);
  }

  const saveError = editing ? mutations.update.error : mutations.create.error;
  const isFiltered = status !== 'all';

  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Advertisements"
        description="Manage banner advertisements on your website."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Add Advertisement
          </Button>
        }
      />

      <section className="border-hairline overflow-hidden rounded-card border bg-surface shadow-sm">
        <div className="border-hairline flex flex-wrap items-center gap-3 border-b p-4">
          <Select
            size="sm"
            className="w-44"
            value={status}
            onValueChange={setStatus}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />

          <Select
            size="sm"
            className="ml-auto w-44"
            value={sort}
            onValueChange={setSort}
            options={SORT_OPTIONS}
            icon={<ArrowUpDown className="size-3.5" aria-hidden />}
            aria-label="Sort by"
          />
        </div>

        {isPending ? (
          <AdvertisementTableSkeleton />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : 'Could not load advertisements.'
            }
            onRetry={() => void refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="size-5" aria-hidden />}
            title={
              isFiltered
                ? 'No matching advertisements'
                : 'No advertisements yet'
            }
            description={
              isFiltered
                ? 'Try a different filter.'
                : 'Add your first advertisement to show it on the website.'
            }
            action={
              !isFiltered ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" aria-hidden />
                  Add Advertisement
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-208 text-left">
                <thead>
                  <tr className="text-ink-subtle border-hairline bg-surface-sunken border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
                    <th className="w-9 py-3 pl-4">#</th>
                    <th className="py-3 pr-4">Preview</th>
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3 pr-4">Date Range</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-hairline divide-y">
                  {visible.map((item, index) => (
                    <AdvertisementRow
                      key={item.id}
                      item={item}
                      position={index + 1}
                      now={now}
                      onEdit={openEdit}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                Showing {visible.length} of {items.length} advertisements
              </span>
              <span
                className={
                  isFetching
                    ? 'opacity-100 transition-opacity'
                    : 'opacity-0 transition-opacity'
                }
              >
                Syncing…
              </span>
            </div>
          </>
        )}
      </section>

      <AdvertisementSheet
        open={sheetOpen}
        editing={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        serverError={
          saveError instanceof ApiError
            ? saveError.message
            : saveError
              ? 'Could not save this advertisement.'
              : null
        }
        onOpenChange={setSheetOpen}
        onSubmit={(values: CreateAdvertisementRequest) => {
          const done = { onSuccess: () => setSheetOpen(false) };
          if (editing) {
            mutations.update.mutate({ id: editing.id, body: values }, done);
          } else {
            mutations.create.mutate(values, done);
          }
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.advertiserName}"?`}
        description="This permanently removes the advertisement. It cannot be undone."
        confirmLabel="Delete advertisement"
        loading={mutations.remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          mutations.remove.mutate(pendingDelete, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
