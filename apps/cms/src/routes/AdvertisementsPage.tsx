import type {
  AdPlacement,
  AdvertisementDto,
  CreateAdvertisementRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Select, type SelectOption } from '@coastal-talk-news/ui/select';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery } from '@tanstack/react-query';
import { Megaphone, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { advertisementsApi } from '../api/advertisements.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { AdvertisementRow } from '../features/advertisements/AdvertisementRow.js';
import { AdvertisementSheet } from '../features/advertisements/AdvertisementSheet.js';
import { AdvertisementTableSkeleton } from '../features/advertisements/AdvertisementTableSkeleton.js';
import {
  PLACEMENTS,
  PLACEMENT_META,
} from '../features/advertisements/placement.js';
import {
  advertisementStatusValue,
  type AdvertisementStatus,
} from '../features/advertisements/status.js';
import { useAdvertisementMutations } from '../features/advertisements/useAdvertisementMutations.js';

type StatusFilter = 'all' | AdvertisementStatus;

const STATUS_OPTIONS: Array<SelectOption<StatusFilter>> = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

const LIST_PARAMS = { limit: 100 };

const CLOCK_TICK_MS = 15_000;

export function AdvertisementsPage() {
  const [placement, setPlacement] = useState<AdPlacement>('TOP');
  const [status, setStatus] = useState<StatusFilter>('all');
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
  // Every placement's ads, unfiltered — the Sheet checks a new booking's zone
  // capacity against this, not just whichever tab is open.
  const allItems = data?.data ?? [];

  // The API already returns each placement in display order (Masthead is the
  // one exception: it has no manual order, so its tab reads chronologically —
  // by when each booking starts — instead).
  const placementItems = useMemo(() => {
    const items = allItems.filter((item) => item.placement === placement);
    if (placement !== 'MASTHEAD') return items;
    return [...items].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [allItems, placement]);

  // Local order the drag handle mutates immediately, ahead of the mutation
  // resolving — mirrors CategoriesPage. Resyncs whenever the tab or the data
  // itself changes.
  const [order, setOrder] = useState<AdvertisementDto[]>([]);
  useEffect(() => {
    setOrder(placementItems);
  }, [placementItems]);

  const visible = useMemo(() => {
    if (status === 'all') return order;
    return order.filter(
      (item) => advertisementStatusValue(item, now) === status,
    );
  }, [order, status, now]);

  // Reordering must cover every ad in the zone, so it only makes sense against
  // the complete, unfiltered list — same rule Categories uses for its drag.
  const isFiltered = status !== 'all';
  const canReorder = placement !== 'MASTHEAD';
  const reorderHint = isFiltered
    ? 'Show All statuses to reorder'
    : 'Drag to reorder';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = order.findIndex((item) => item.id === active.id);
    const to = order.findIndex((item) => item.id === over.id);
    if (from === -1 || to === -1) return;

    const next = arrayMove(order, from, to);
    setOrder(next);
    mutations.reorder.mutate({
      placement,
      ids: next.map((item) => item.id),
    });
  }

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(item: AdvertisementDto) {
    setEditing(item);
    setSheetOpen(true);
  }

  const saveError = editing ? mutations.update.error : mutations.create.error;

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

      <div
        role="tablist"
        aria-label="Placement"
        className="border-hairline mb-4 inline-flex rounded-lg border bg-surface-sunken p-0.5"
      >
        {PLACEMENTS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={placement === tab}
            onClick={() => setPlacement(tab)}
            className={
              placement === tab
                ? 'text-ink rounded-[7px] bg-surface px-3.5 py-1.5 text-sm font-medium shadow-sm transition-all'
                : 'text-ink-muted rounded-[7px] px-3.5 py-1.5 text-sm font-medium transition-colors hover:text-ink'
            }
          >
            {PLACEMENT_META[tab].label}
          </button>
        ))}
      </div>

      <section className="border-hairline overflow-hidden rounded-card border bg-surface shadow-sm">
        <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <p className="text-ink-subtle text-sm">
            {placement === 'MASTHEAD'
              ? 'Only one ad runs at a time here, so there is nothing to order — this follows the schedule below.'
              : 'Drag a row to change where it appears on the website.'}
          </p>

          <Select
            size="sm"
            className="w-44"
            value={status}
            onValueChange={setStatus}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
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
                : `No advertisements in ${PLACEMENT_META[placement].label} yet`
            }
            description={
              isFiltered
                ? 'Try a different filter.'
                : 'Add one to show it on the website.'
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full min-w-208 text-left">
                  <thead>
                    <tr className="text-ink-subtle border-hairline bg-surface-sunken border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
                      {canReorder && (
                        <>
                          <th className="w-9 pl-4">
                            <span className="sr-only">Reorder</span>
                          </th>
                          <th className="w-9 py-3 pl-2">#</th>
                        </>
                      )}
                      <th className={`py-3 pr-4 ${canReorder ? '' : 'pl-4'}`}>
                        Preview
                      </th>
                      <th className="py-3 pr-4">Title</th>
                      <th className="py-3 pr-4">Date Range</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-hairline divide-y">
                    <SortableContext
                      items={visible.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                      disabled={!canReorder}
                    >
                      {visible.map((item, index) => (
                        <AdvertisementRow
                          key={item.id}
                          item={item}
                          position={index + 1}
                          now={now}
                          onEdit={openEdit}
                          onDelete={setPendingDelete}
                          reorder={
                            canReorder
                              ? { disabled: isFiltered, hint: reorderHint }
                              : undefined
                          }
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                Showing {visible.length} of {order.length} in{' '}
                {PLACEMENT_META[placement].label}
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
        advertisements={allItems}
        defaultPlacement={placement}
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
