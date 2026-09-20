import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SHORTCUT_GROUPS, type ShortcutEntry } from './registry.js';

/** Mac keyboards label the modifier ⌘, and "Ctrl" there reads as a shortcut
 * that simply doesn't work. */
function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(
      /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent),
    );
  }, []);
  return isMac;
}

function joiner(entry: ShortcutEntry): string {
  if (entry.sequence) return 'then';
  if (entry.alternatives) return 'or';
  return '+';
}

function Keys({ entry, isMac }: { entry: ShortcutEntry; isMac: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {entry.keys.map((key, index) => (
        <span key={key} className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="text-ink-subtle text-[10px]">{joiner(entry)}</span>
          )}
          <kbd className="border-hairline bg-surface-sunken text-ink inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-sans text-[11px] font-semibold">
            {key === 'Ctrl' && isMac ? '⌘' : key}
          </kbd>
        </span>
      ))}
    </span>
  );
}

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMac = useIsMac();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content className="bg-surface rounded-card data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col shadow-2xl">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div>
              <Dialog.Title className="text-ink text-base font-semibold">
                Keyboard shortcuts
              </Dialog.Title>
              <Dialog.Description className="text-ink-muted mt-1 text-sm">
                These work anywhere except while you are typing in a field.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="text-ink-subtle hover:bg-surface-sunken hover:text-ink -mt-1 -mr-2 rounded-lg p-2 transition-colors"
            >
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          {/* Flowed rather than a grid: the groups are different lengths, and
              grid rows would leave a short group sitting above a long hole. */}
          <div className="columns-1 gap-x-10 overflow-y-auto px-6 pb-2 sm:columns-2">
            {SHORTCUT_GROUPS.map((group) => (
              <section key={group.title} className="mb-6 break-inside-avoid">
                <h3 className="text-ink-subtle mb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {group.title}
                </h3>
                <ul>
                  {group.entries.map((entry) => (
                    <li
                      key={entry.label}
                      className="flex items-center justify-between gap-6 py-1.5"
                    >
                      <span className="min-w-0">
                        <span className="text-ink block text-sm leading-snug">
                          {entry.label}
                        </span>
                        {entry.note && (
                          <span className="text-ink-subtle block text-xs leading-snug">
                            {entry.note}
                          </span>
                        )}
                      </span>
                      <Keys entry={entry} isMac={isMac} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="border-hairline text-ink-subtle border-t px-6 py-3 text-xs">
            Press{' '}
            <kbd className="border-hairline bg-surface-sunken text-ink rounded border px-1 font-sans text-[11px] font-semibold">
              ?
            </kbd>{' '}
            at any time to open this list.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
