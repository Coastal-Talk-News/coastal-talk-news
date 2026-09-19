import type { CmsCategoryDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { cn } from '@coastal-talk-news/ui/cn';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { iconButtonClass } from '@coastal-talk-news/ui/icon-button';
import { useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  Hash,
  Pencil,
  Trash2,
} from 'lucide-react';
import { INDENT_WIDTH } from './tree.js';

interface CategoryRowProps {
  category: CmsCategoryDto;
  /** 0 for top-level. While dragging this is the depth the drop would land
   * at, so the row previews its own destination. */
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  /** True for the row currently being dragged — it stays in place as the
   * drop preview while the overlay follows the pointer. */
  isDragging: boolean;
  onToggleExpand: () => void;
  onEdit: (category: CmsCategoryDto) => void;
  onDelete: (category: CmsCategoryDto) => void;
  onToggleActive: (category: CmsCategoryDto, isActive: boolean) => void;
  dragDisabled: boolean;
  dragHint: string;
}

// Layout animations during and right after a drag fight with the rows
// dnd-kit is already translating, which reads as rows jumping twice.
const animateLayoutChanges: AnimateLayoutChanges = ({
  isSorting,
  wasDragging,
}) => !(isSorting || wasDragging);

export function CategoryRow({
  category,
  depth,
  hasChildren,
  expanded,
  isDragging,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  dragDisabled,
  dragHint,
}: CategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: category.id,
      disabled: dragDisabled,
      animateLayoutChanges,
    });

  const canDelete = category.articleCount === 0 && !hasChildren;
  const deleteBlockedReason = hasChildren
    ? 'Move or delete its subcategories first'
    : `Move or delete ${category.articleCount} article${category.articleCount === 1 ? '' : 's'} first`;

  return (
    <li
      ref={setNodeRef}
      // Only the vertical part of the sort translate: horizontal drag means
      // depth here, and that reads as the indent below, not as the row
      // sliding off sideways.
      style={{
        transform: CSS.Translate.toString(
          transform ? { ...transform, x: 0 } : null,
        ),
        transition: transition ?? undefined,
      }}
      className={cn(
        'group flex items-center gap-3 px-4',
        isDragging
          ? 'border-accent bg-accent-soft/50 rounded-lg border border-dashed py-2.5'
          : 'py-3 transition-colors hover:bg-surface-sunken',
      )}
    >
      {dragDisabled ? (
        <Tooltip label={dragHint}>
          <span className="text-ink-subtle/40 inline-flex shrink-0 cursor-not-allowed p-1">
            <GripVertical className="size-4" aria-hidden />
          </span>
        </Tooltip>
      ) : (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Move ${category.name}`}
          className="text-ink-subtle/50 hover:bg-surface hover:text-ink shrink-0 cursor-grab touch-none rounded p-1 transition-colors group-hover:text-ink-subtle active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      )}

      {/* One guide per level above this row, so a subcategory reads as
          belonging to the group it sits under rather than merely indented. */}
      {Array.from({ length: depth }, (_, level) => (
        <span
          key={level}
          aria-hidden
          className="border-hairline shrink-0 self-stretch border-l"
          style={{ width: INDENT_WIDTH - 12 }}
        />
      ))}

      {hasChildren ? (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}
          aria-expanded={expanded}
          className="text-ink-subtle hover:bg-surface hover:text-ink grid size-5 shrink-0 place-items-center rounded transition-colors"
        >
          <ChevronRight
            className={cn(
              'size-3.5 transition-transform',
              expanded && 'rotate-90',
            )}
            aria-hidden
          />
        </button>
      ) : (
        <span className="size-5 shrink-0" aria-hidden />
      )}

      {/* One slot for what this row is: its cover if it has one, otherwise
          the folder/leaf mark. A placeholder box on every image-less row
          just adds a column of empty grey. */}
      {category.coverImage ? (
        <img
          src={category.coverImage.url}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-md object-cover ring-1 ring-black/5"
        />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center">
          {hasChildren ? (
            expanded ? (
              <FolderOpen className="text-accent-text size-4" aria-hidden />
            ) : (
              <Folder className="text-accent-text size-4" aria-hidden />
            )
          ) : (
            <Hash className="text-ink-subtle size-3.5" aria-hidden />
          )}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate',
            hasChildren ? 'text-ink font-semibold' : 'text-ink font-medium',
          )}
        >
          {category.name}
        </p>
        {category.description && (
          <p className="text-ink-muted mt-0.5 line-clamp-1 text-xs">
            {category.description}
          </p>
        )}
      </div>

      <div className="w-24 shrink-0">
        {hasChildren ? (
          <Badge tone="slate">Group</Badge>
        ) : (
          <span className="text-ink-muted text-sm tabular-nums">
            {category.articleCount}
          </span>
        )}
      </div>

      <div className="w-24 shrink-0">
        <Badge tone={category.isActive ? 'green' : 'slate'} dot>
          {category.isActive ? 'Active' : 'Hidden'}
        </Badge>
      </div>

      <div className="flex w-28 shrink-0 items-center justify-end gap-1.5 opacity-65 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Tooltip
          label={category.isActive ? 'Hide from website' : 'Show on website'}
        >
          <span className="inline-flex">
            <Toggle
              checked={category.isActive}
              onCheckedChange={(isActive) => onToggleActive(category, isActive)}
              aria-label={`${category.isActive ? 'Hide' : 'Show'} ${category.name}`}
            />
          </span>
        </Tooltip>

        <Tooltip label="Edit">
          <button
            type="button"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.name}`}
            className={iconButtonClass()}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        </Tooltip>

        <Tooltip label={canDelete ? 'Delete' : deleteBlockedReason}>
          <span className="inline-flex">
            <button
              type="button"
              onClick={() => onDelete(category)}
              disabled={!canDelete}
              aria-label={`Delete ${category.name}`}
              className={iconButtonClass('danger')}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </span>
        </Tooltip>
      </div>
    </li>
  );
}

/** The card that follows the pointer during a drag. */
export function CategoryDragPreview({
  category,
}: {
  category: CmsCategoryDto;
}) {
  return (
    <div className="border-accent bg-surface flex items-center gap-2.5 rounded-lg border px-3 py-2.5 shadow-lg">
      <GripVertical className="text-ink-subtle size-4 shrink-0" aria-hidden />
      <span className="text-ink text-sm font-medium">{category.name}</span>
    </div>
  );
}
