import { cn } from '@coastal-talk-news/ui/cn';
import { Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

export function UploadZone({ onFiles }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFiles(files);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'rounded-card border border-dashed p-6 transition-colors',
        dragging
          ? 'border-accent bg-accent-soft'
          : 'border-hairline bg-surface-sunken',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          pick(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="bg-surface text-ink-muted grid size-11 place-items-center rounded-full">
          <Upload className="size-5" aria-hidden />
        </span>
        <p className="text-ink text-sm font-medium">
          Drop images here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-accent-text underline underline-offset-2"
          >
            browse
          </button>
        </p>
        <p className="text-ink-subtle text-xs">
          JPG, PNG, WebP, AVIF or GIF · up to 10MB each
        </p>
      </div>
    </div>
  );
}
