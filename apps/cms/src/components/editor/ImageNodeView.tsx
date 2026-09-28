import { cn } from '@coastal-talk-news/ui/cn';
import {
  IMAGE_CAPTION_MAX,
  IMAGE_DEFAULT_WIDTH_PERCENT,
} from '@coastal-talk-news/validation/limits';
import {
  NodeViewWrapper,
  useEditorState,
  type NodeViewProps,
} from '@tiptap/react';
import { useRef, useState, type PointerEvent } from 'react';
import { CroppedImage } from '../../features/media/CroppedImage.js';
import {
  clampWidth,
  placementClass,
  resizeEdges,
} from '../../features/media/imageFrame.js';
import type { ImageAttrs } from './imageAttrs.js';

interface Drag {
  pointerX: number;
  startWidth: number;
  /** Percent of width gained per pixel dragged, signed for the edge held. */
  percentPerPixel: number;
  width: number;
}

export function ImageNodeView({
  node,
  editor,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const attrs = node.attrs as ImageAttrs;
  const placement = attrs.placement ?? 'center';
  const savedWidth = attrs.widthPercent ?? IMAGE_DEFAULT_WIDTH_PERCENT;

  const editable = useEditorState({
    editor,
    selector: ({ editor: current }) => current.isEditable,
  });
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);
  const drag = useRef<Drag | null>(null);

  const width = draggedWidth ?? savedWidth;
  const active = selected && editable;

  function startResize(edge: 'left' | 'right', event: PointerEvent) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    // The width is a share of the text column, which is the editor itself.
    const column = editor.view.dom;
    const styles = getComputedStyle(column);
    const room =
      column.clientWidth -
      parseFloat(styles.paddingLeft) -
      parseFloat(styles.paddingRight);
    // A centred picture grows on both sides at once, so the held edge only
    // has to travel half as far for the width to follow the pointer.
    const sides = placement === 'center' ? 2 : 1;
    drag.current = {
      pointerX: event.clientX,
      startWidth: savedWidth,
      percentPerPixel: ((edge === 'right' ? 1 : -1) * sides * 100) / room,
      width: savedWidth,
    };
  }

  function resize(event: PointerEvent) {
    const current = drag.current;
    if (!current) return;
    current.width = clampWidth(
      current.startWidth +
        (event.clientX - current.pointerX) * current.percentPerPixel,
    );
    setDraggedWidth(current.width);
  }

  function endResize() {
    const current = drag.current;
    drag.current = null;
    setDraggedWidth(null);
    if (current && current.width !== savedWidth) {
      updateAttributes({ widthPercent: current.width });
    }
  }

  return (
    <NodeViewWrapper
      className={cn('my-3', placementClass(placement))}
      style={{ width: `${width}%` }}
      data-placement={placement}
    >
      <div
        className={cn(
          'relative rounded-sm',
          active && 'ring-accent ring-2 ring-offset-2',
        )}
      >
        {attrs.src && (
          <CroppedImage
            src={attrs.src}
            alt={attrs.title ?? ''}
            width={attrs.naturalWidth ?? 1280}
            height={attrs.naturalHeight ?? 720}
            crop={attrs.mediaId ? attrs.crop : null}
          />
        )}

        {active &&
          resizeEdges(placement).map((edge) => (
            <span
              key={edge}
              role="presentation"
              data-image-control
              onPointerDown={(event) => startResize(edge, event)}
              onPointerMove={resize}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              className={cn(
                'bg-accent absolute top-1/2 z-10 h-12 w-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full shadow ring-2 ring-white',
                edge === 'left' ? '-left-1.5' : '-right-1.5',
              )}
            />
          ))}

        {draggedWidth !== null && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
            {draggedWidth}%
          </span>
        )}
      </div>

      {editable && (selected || attrs.title) ? (
        <input
          value={attrs.title ?? ''}
          maxLength={IMAGE_CAPTION_MAX}
          placeholder="Add a caption"
          aria-label="Image caption"
          data-image-control
          onChange={(event) =>
            updateAttributes({ title: event.target.value || null })
          }
          className="text-ink-subtle placeholder:text-ink-subtle/70 mt-2 w-full bg-transparent text-center text-xs outline-none"
        />
      ) : (
        attrs.title && (
          <p className="text-ink-subtle mt-2 text-center text-xs">
            {attrs.title}
          </p>
        )
      )}
    </NodeViewWrapper>
  );
}
