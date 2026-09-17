import type { AdvertisementDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { cn } from '@coastal-talk-news/ui/cn';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { Tooltip } from '@coastal-talk-news/ui/tooltip';
import { iconButtonClass } from '@coastal-talk-news/ui/icon-button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/format.js';
import { advertisementStatus } from './status.js';

interface AdvertisementRowProps {
  item: AdvertisementDto;
  position: number;
  now: Date;
  onEdit: (item: AdvertisementDto) => void;
  onDelete: (item: AdvertisementDto) => void;
  /** Absent hides the reorder column entirely — Masthead has nothing to drag. */
  reorder?: {
    disabled: boolean;
    hint: string;
  };
}

export function AdvertisementRow({
  item,
  position,
  now,
  onEdit,
  onDelete,
  reorder,
}: AdvertisementRowProps) {
  const status = advertisementStatus(item, now);
  const isLive = status.value === 'active';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !reorder || reorder.disabled });

  return (
    <tr
      ref={reorder ? setNodeRef : undefined}
      style={
        reorder
          ? { transform: CSS.Transform.toString(transform), transition }
          : undefined
      }
      className={cn(
        'group align-middle transition-colors',
        isDragging
          ? 'relative z-10 bg-accent-soft/60 shadow-lg ring-1 ring-accent/30'
          : 'hover:bg-surface-sunken',
      )}
    >
      {reorder && (
        <td className="w-9 pl-4">
          {reorder.disabled ? (
            <Tooltip label={reorder.hint}>
              <span className="text-ink-subtle inline-flex cursor-not-allowed p-1">
                <GripVertical className="size-4" aria-hidden />
              </span>
            </Tooltip>
          ) : (
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${item.advertiserName}`}
              className="text-ink-subtle/60 hover:bg-surface hover:text-ink cursor-grab rounded p-1 transition-colors group-hover:text-ink-subtle active:cursor-grabbing"
            >
              <GripVertical className="size-4" aria-hidden />
            </button>
          )}
        </td>
      )}

      {reorder && (
        <td className="text-ink-subtle w-9 py-3 pl-2 text-sm tabular-nums">
          {position}
        </td>
      )}

      <td className={cn('py-3 pr-4', !reorder && 'pl-4')}>
        <img
          src={item.image.url}
          alt=""
          width={64}
          height={40}
          className="h-10 w-16 rounded-md object-cover ring-1 ring-black/5"
        />
      </td>

      <td className="py-3 pr-4">
        <div className="flex max-w-xs items-center gap-1.5">
          <p className="text-ink truncate font-medium">{item.advertiserName}</p>
          {item.destinationUrl && (
            <a
              href={item.destinationUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open link for ${item.advertiserName}`}
              className="text-ink-subtle shrink-0 transition-colors hover:text-accent-text"
            >
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      </td>

      <td className="py-3 pr-4 text-sm">
        <p className="text-ink">
          {formatDate(item.startAt)} · {formatTime(item.startAt)}
        </p>
        <p className="text-ink-subtle text-xs">
          to {formatDate(item.endAt)} · {formatTime(item.endAt)}
        </p>
      </td>

      <td className="py-3 pr-4">
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </td>

      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-1.5 opacity-65 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Tooltip
            label={
              isLive
                ? 'Live now — turns off automatically at End'
                : 'Not live — follows the schedule above'
            }
          >
            <span className="inline-flex">
              <Toggle
                checked={isLive}
                disabled
                onCheckedChange={() => {}}
                aria-label={`${item.advertiserName} is ${isLive ? 'live' : 'not live'}`}
              />
            </span>
          </Tooltip>

          <Tooltip label="Edit">
            <button
              type="button"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.advertiserName}`}
              className={iconButtonClass()}
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </Tooltip>

          <Tooltip label="Delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.advertiserName}`}
              className={iconButtonClass('danger')}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}
