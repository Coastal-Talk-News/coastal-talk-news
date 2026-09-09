import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

/**
 * Left slide-over for mobile navigation.
 *
 * Portals to document.body so the scrim is measured against the viewport
 * rather than an ancestor's containing block — rendered inline, a fixed
 * overlay can be clipped by any parent with a transform, filter or contain,
 * leaving strips of the page uncovered. Dialog also locks body scroll, so the
 * page cannot be scrolled out from under the scrim.
 */
export function Drawer({ open, onOpenChange, title, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left fixed inset-y-0 left-0 z-50 w-64 shadow-2xl focus:outline-none"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
