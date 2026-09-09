import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button.js';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content className="data-[state=open]:animate-rise fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-raised p-6 shadow-2xl">
          <div className="flex gap-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger-text">
              <AlertTriangle className="size-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <Dialog.Title className="text-ink text-base font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="text-ink-muted text-sm">{description}</div>
              </Dialog.Description>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
