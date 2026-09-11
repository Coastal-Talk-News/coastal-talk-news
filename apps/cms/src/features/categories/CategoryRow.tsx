import type { CmsCategoryDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { cn } from '@coastal-talk-news/ui/cn';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { iconButtonClass } from '@coastal-talk-news/ui/icon-button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImageIcon, Pencil, Trash2 } from 'lucide-react';

interface CategoryRowProps {
  category: CmsCategoryDto;
  position: number;
  onEdit: (category: CmsCategoryDto) => void;
  onDelete: (category: CmsCategoryDto) => void;
  onToggleActive: (category: CmsCategoryDto, isActive: boolean) => void;
  reorderDisabled: boolean;
  reorderHint: string;
}

export function CategoryRow({
  category,
  position,
  onEdit,
  onDelete,
  onToggleActive,
  reorderDisabled,
  reorderHint,
}: CategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: reorderDisabled });

  const canDelete = category.articleCount === 0;

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group align-middle transition-colors',
        isDragging
          ? 'relative z-10 bg-accent-soft/60 shadow-lg ring-1 ring-accent/30'
          : 'hover:bg-surface-sunken',
      )}
    >
      <td className="w-9 pl-4">
        {reorderDisabled ? (
          <Tooltip label={reorderHint}>
            <span className="text-ink-subtle inline-flex cursor-not-allowed p-1">
              <GripVertical className="size-4" aria-hidden />
            </span>
          </Tooltip>
        ) : (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${category.name}`}
            className="text-ink-subtle/60 hover:bg-surface hover:text-ink cursor-grab rounded p-1 transition-colors group-hover:text-ink-subtle active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}
      </td>

      <td className="text-ink-subtle w-9 py-3 text-sm tabular-nums">
        {position}
      </td>

      <td className="py-3">
        {category.coverImage ? (
          <img
            src={category.coverImage.url}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-lg object-cover ring-1 ring-black/5"
          />
        ) : (
          <span className="text-ink-subtle grid size-12 place-items-center rounded-lg bg-surface-sunken">
            <ImageIcon className="size-4" aria-hidden />
          </span>
        )}
      </td>

      <td className="py-3 pr-4">
        <p className="text-ink font-medium">{category.name}</p>
        {category.description && (
          <p className="text-ink-muted mt-0.5 line-clamp-1 max-w-md text-xs">
            {category.description}
          </p>
        )}
      </td>

      <td className="py-3 pr-4">
        <span className="text-ink-muted text-sm tabular-nums">
          {category.articleCount}
        </span>
      </td>

      <td className="py-3 pr-4">
        <Badge tone={category.isActive ? 'green' : 'slate'} dot>
          {category.isActive ? 'Active' : 'Hidden'}
        </Badge>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5 opacity-65 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Tooltip
            label={category.isActive ? 'Hide from website' : 'Show on website'}
          >
            <span className="inline-flex">
              <Toggle
                checked={category.isActive}
                onCheckedChange={(isActive) =>
                  onToggleActive(category, isActive)
                }
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

          <Tooltip
            label={
              canDelete
                ? 'Delete'
                : `Move or delete ${category.articleCount} article${category.articleCount === 1 ? '' : 's'} first`
            }
          >
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
      </td>
    </tr>
  );
}
