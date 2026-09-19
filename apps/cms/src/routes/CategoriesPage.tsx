import type { CmsCategoryDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Input } from '@coastal-talk-news/ui/input';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  LayoutGrid,
  MoveHorizontal,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { categoriesApi } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import {
  CategoryDragPreview,
  CategoryRow,
} from '../features/categories/CategoryRow.js';
import { CategoryTableSkeleton } from '../features/categories/CategoryTableSkeleton.js';
import { CategorySheet } from '../features/categories/CategorySheet.js';
import {
  categoriesWithChildrenIds,
  descendantIds,
  flattenTree,
  getProjection,
  siblingOrderAfterMove,
  sortByDisplayOrder,
  type FlatCategory,
} from '../features/categories/tree.js';
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

  // The query cache is the single source of truth — mutations patch it
  // optimistically, so there's no second local copy of the list to drift
  // back to a stale order between the drop and the server's reply.
  const categories = useMemo(() => data?.data ?? [], [data]);

  const searchTerm = debouncedSearch.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm) ||
        (category.description ?? '').toLowerCase().includes(searchTerm),
    );
  }, [categories, searchTerm]);

  const isFiltered = searchTerm !== '' || status !== 'all';
  // Reordering writes the whole group's order at once, so it can only run
  // against the full list — a filtered view is missing rows it would drop.
  const dragHint = isFiltered
    ? 'Clear the search and filter to rearrange'
    : 'Drag to move';

  const groupIds = useMemo(
    () => categoriesWithChildrenIds(categories),
    [categories],
  );

  // Groups start open, and what's tracked is which ones the admin shut —
  // the inverse can't survive a refetch, because a group that was collapsed
  // on purpose and one that has just appeared both read as "not expanded",
  // so restoring the new one's default reopens the other.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reveal(id: string) {
    setCollapsed((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  const allExpanded = [...groupIds].every((id) => !collapsed.has(id));

  function toggleExpandAll() {
    setCollapsed(allExpanded ? new Set(groupIds) : new Set());
  }

  const rows = useMemo<FlatCategory[]>(() => {
    if (searchTerm) {
      return sortByDisplayOrder(visible).map((category) => ({
        category,
        parentId: category.parentId ?? null,
        depth: 0,
      }));
    }
    return flattenTree(visible, collapsed);
  }, [visible, collapsed, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Vertical drag picks the position, horizontal drag picks the depth — the
  // only way a drag can say "out of this group and under that one," which
  // dropping onto a row cannot express on its own.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  // A category can't be dropped inside its own subtree, so that subtree
  // leaves the list for the duration of the drag.
  const dragRows = useMemo(() => {
    if (!draggingId) return rows;
    const inside = descendantIds(categories, draggingId);
    return rows.filter((row) => !inside.has(row.category.id));
  }, [rows, draggingId, categories]);

  const projection =
    draggingId && overId
      ? getProjection(dragRows, draggingId, overId, offsetLeft)
      : null;

  function resetDrag() {
    setDraggingId(null);
    setOverId(null);
    setOffsetLeft(0);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setDraggingId(String(active.id));
    setOverId(String(active.id));
    setOffsetLeft(0);
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over ? String(over.id) : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const currentRows = dragRows;
    const currentOffset = offsetLeft;
    resetDrag();

    if (!over) return;
    const category = categories.find((item) => item.id === id);
    const target = getProjection(
      currentRows,
      id,
      String(over.id),
      currentOffset,
    );
    if (!category || !target) return;

    const parentIsExpanded =
      target.parentId === null || !collapsed.has(target.parentId);
    const siblingIds = siblingOrderAfterMove(
      currentRows,
      categories,
      id,
      String(over.id),
      target.parentId,
      parentIsExpanded,
    );
    if (siblingIds.length === 0) return;

    const parentChanged = (category.parentId ?? null) !== target.parentId;
    const currentOrder = sortByDisplayOrder(
      categories.filter((item) => (item.parentId ?? null) === target.parentId),
    ).map((item) => item.id);
    const unchanged =
      !parentChanged &&
      currentOrder.length === siblingIds.length &&
      currentOrder.every((value, index) => value === siblingIds[index]);
    if (unchanged) return;

    if (target.parentId) {
      reveal(target.parentId);
    }
    mutations.move.mutate({
      id,
      parentId: target.parentId,
      parentChanged,
      siblingIds,
    });
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
  const draggingCategory = draggingId
    ? (categories.find((category) => category.id === draggingId) ?? null)
    : null;
  const projectedParent = projection?.parentId
    ? categories.find((category) => category.id === projection.parentId)
    : null;

  return (
    <>
      <PageHeader
        eyebrow="News"
        title="Categories"
        description="Group related categories together. Articles are filed against the ones with no subcategories of their own."
        actions={
          <div className="flex gap-2">
            {groupIds.size > 0 && !isFiltered && (
              <Button variant="secondary" onClick={toggleExpandAll}>
                {allExpanded ? (
                  <ChevronsDownUp className="size-4" aria-hidden />
                ) : (
                  <ChevronsUpDown className="size-4" aria-hidden />
                )}
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          </div>
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
        ) : rows.length === 0 ? (
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
            {!isFiltered && (
              <div
                aria-live="polite"
                className={
                  draggingCategory
                    ? 'border-accent bg-accent-soft text-accent-text flex items-center gap-2 border-b px-4 py-2 text-sm'
                    : 'text-ink-muted border-hairline flex items-center gap-2 border-b px-4 py-2 text-xs'
                }
              >
                <MoveHorizontal className="size-3.5 shrink-0" aria-hidden />
                {draggingCategory ? (
                  <span>
                    <strong className="font-semibold">
                      {draggingCategory.name}
                    </strong>{' '}
                    {projectedParent
                      ? `will move under “${projectedParent.name}”.`
                      : 'will move to the top level.'}
                  </span>
                ) : (
                  <span>
                    Drag a row up or down to reorder it, or sideways to move it
                    in and out of a group.
                  </span>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="min-w-4xl">
                <div className="text-ink-subtle border-hairline bg-surface-sunken flex items-center gap-3 border-b px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                  <span className="w-6 shrink-0" aria-hidden />
                  <span className="flex-1">Category</span>
                  <span className="w-24 shrink-0">Articles</span>
                  <span className="w-24 shrink-0">Status</span>
                  <span className="w-28 shrink-0 text-right">Actions</span>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  measuring={{
                    droppable: { strategy: MeasuringStrategy.Always },
                  }}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDragCancel={resetDrag}
                >
                  <SortableContext
                    items={dragRows.map((row) => row.category.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="divide-hairline divide-y">
                      {dragRows.map((row) => {
                        const isDragging = row.category.id === draggingId;
                        return (
                          <CategoryRow
                            key={row.category.id}
                            category={row.category}
                            depth={
                              isDragging && projection
                                ? projection.depth
                                : row.depth
                            }
                            hasChildren={groupIds.has(row.category.id)}
                            expanded={!collapsed.has(row.category.id)}
                            isDragging={isDragging}
                            onToggleExpand={() =>
                              toggleExpanded(row.category.id)
                            }
                            onEdit={openEdit}
                            onDelete={setPendingDelete}
                            onToggleActive={(target, isActive) =>
                              mutations.setActive.mutate({
                                id: target.id,
                                isActive,
                              })
                            }
                            dragDisabled={isFiltered}
                            dragHint={dragHint}
                          />
                        );
                      })}
                    </ul>
                  </SortableContext>

                  <DragOverlay>
                    {draggingCategory && (
                      <CategoryDragPreview category={draggingCategory} />
                    )}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>

            <div className="border-hairline text-ink-muted flex items-center justify-between border-t px-4 py-3 text-xs">
              <span>
                Showing {rows.length} of {total}{' '}
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
        existingNames={categories.map((category) => category.name)}
        categories={categories}
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
