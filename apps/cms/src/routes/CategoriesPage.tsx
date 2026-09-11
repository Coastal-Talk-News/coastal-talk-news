import type { CmsCategoryDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Input } from '@coastal-talk-news/ui/input';
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
import { LayoutGrid, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { categoriesApi } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { CategoryRow } from '../features/categories/CategoryRow.js';
import { CategoryTableSkeleton } from '../features/categories/CategoryTableSkeleton.js';
import { CategorySheet } from '../features/categories/CategorySheet.js';
import { useCategoryMutations } from '../features/categories/useCategoryMutations.js';
import { SEARCH_DEBOUNCE_MS, useDebounced } from '../lib/useDebounced.js';

type StatusFilter = 'all' | 'active' | 'hidden';

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
];

const STATUS_PARAM: Record<StatusFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  hidden: false,
};

export function CategoriesPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CmsCategoryDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CmsCategoryDto | null>(
    null,
  );

  const params = { limit: 100, isActive: STATUS_PARAM[status] };
  const listKey = queryKeys.categoryList(params);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => categoriesApi.list(params, signal),
  });

  const mutations = useCategoryMutations(listKey);

  const [order, setOrder] = useState<CmsCategoryDto[]>([]);
  useEffect(() => {
    if (data) setOrder(data.data);
  }, [data]);

  const visible = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return order;
    return order.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description ?? '').toLowerCase().includes(term),
    );
  }, [order, debouncedSearch]);

  const isFiltered = debouncedSearch.trim() !== '' || status !== 'all';
  const reorderHint = isFiltered
    ? 'Clear the search and filter to reorder'
    : 'Drag to reorder';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = order.findIndex((category) => category.id === active.id);
    const to = order.findIndex((category) => category.id === over.id);
    if (from === -1 || to === -1) return;

    const next = arrayMove(order, from, to);
    setOrder(next);
    mutations.reorder.mutate(next.map((category) => category.id));
  }

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(category: CmsCategoryDto) {
    setEditing(category);
    setSheetOpen(true);
  }

  const saveError = editing ? mutations.update.error : mutations.create.error;
  const total = data?.meta.total ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="Categories"
        description="Organise your news. Active categories appear in the website navigation."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Add category
          </Button>
        }
      />

      <section className="border-hairline overflow-hidden rounded-card border bg-surface shadow-sm">
        <div className="border-hairline flex flex-wrap items-center gap-3 border-b p-4">
          <div className="min-w-56 flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or description…"
              aria-label="Search categories"
              icon={<Search className="size-4" aria-hidden />}
              className={search ? 'pr-9' : undefined}
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter by status"
            className="border-hairline flex rounded-lg border bg-surface-sunken p-0.5"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => setStatus(tab.value)}
                className={
                  status === tab.value
                    ? 'text-ink rounded-[7px] bg-surface px-3.5 py-1.5 text-sm font-medium shadow-sm transition-all'
                    : 'text-ink-muted rounded-[7px] px-3.5 py-1.5 text-sm font-medium transition-colors hover:text-ink'
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              <X className="size-4" aria-hidden />
              Clear
            </Button>
          )}
        </div>

        {isPending ? (
          <CategoryTableSkeleton />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : 'Could not load categories.'
            }
            onRetry={() => void refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="size-5" aria-hidden />}
            title={isFiltered ? 'No matching categories' : 'No categories yet'}
            description={
              isFiltered
                ? 'Try a different search term or clear the filter.'
                : 'Create your first category to start organising the news.'
            }
            action={
              isFiltered ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" aria-hidden />
                  Add category
                </Button>
              )
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
                      <th className="w-9 pl-4">
                        <span className="sr-only">Reorder</span>
                      </th>
                      <th className="w-9 py-3">#</th>
                      <th className="py-3">Image</th>
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">Articles</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-hairline divide-y">
                    <SortableContext
                      items={visible.map((category) => category.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {visible.map((category, index) => (
                        <CategoryRow
                          key={category.id}
                          category={category}
                          position={index + 1}
                          onEdit={openEdit}
                          onDelete={setPendingDelete}
                          onToggleActive={(target, isActive) =>
                            mutations.setActive.mutate({
                              id: target.id,
                              isActive,
                            })
                          }
                          reorderDisabled={isFiltered}
                          reorderHint={reorderHint}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                Showing {visible.length} of {total}{' '}
                {total === 1 ? 'category' : 'categories'}
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

      <CategorySheet
        open={sheetOpen}
        editing={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        serverError={
          saveError instanceof ApiError
            ? saveError.message
            : saveError
              ? 'Could not save this category.'
              : null
        }
        existingNames={order.map((category) => category.name)}
        onOpenChange={setSheetOpen}
        onSubmit={(values) => {
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
        title={`Delete “${pendingDelete?.name}”?`}
        description="This permanently removes the category. It cannot be undone."
        confirmLabel="Delete category"
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
