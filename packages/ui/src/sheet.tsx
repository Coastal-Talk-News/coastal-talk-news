import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Right-hand slide-over. Built on Dialog so it inherits focus trapping, Esc to
 * close, scroll locking and aria wiring instead of reimplementing them.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content className="data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right fixed inset-y-0 right-0 z-50 flex w-[min(28rem,100vw)] flex-col bg-surface-raised shadow-2xl">
          <div className="border-hairline flex items-start justify-between border-b px-6 py-5">
            <div>
              <Dialog.Title className="text-ink text-lg font-semibold">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-ink-muted mt-0.5 text-sm">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="text-ink-muted -mr-2 rounded-lg p-2 transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer && (
            <div className="border-hairline border-t bg-surface-sunken px-6 py-4">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
