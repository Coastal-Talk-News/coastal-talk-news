import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn.js';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Array<SelectOption<T>>;
  placeholder?: string;
  icon?: ReactNode;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  'aria-label'?: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Radix forbids an empty Item value, but '' is how callers spell "no filter".
const EMPTY_VALUE = '__none__';

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  icon,
  id,
  disabled,
  invalid,
  size = 'md',
  className,
  ...props
}: SelectProps<T>) {
  const hasEmptyOption = options.some((option) => option.value === '');
  const toRadix = (raw: string) =>
    hasEmptyOption && raw === '' ? EMPTY_VALUE : raw;
  const selected = options.find((option) => option.value === value);

  // Radix echoes an empty selection while its menu is closed, which wipes the field.
  function handleValueChange(next: string) {
    const mapped = next === EMPTY_VALUE ? '' : next;
    if (!options.some((option) => option.value === mapped)) return;
    onValueChange(mapped as T);
  }

  return (
    <RadixSelect.Root
      value={toRadix(value)}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        id={id}
        aria-label={props['aria-label']}
        aria-invalid={invalid || undefined}
        className={cn(
          'group text-ink bg-surface inline-flex w-full items-center gap-2 rounded-lg px-3 text-sm ring-1',
          'transition-[box-shadow,background-color] duration-150',
          'focus:ring-2 focus:outline-none',
          'disabled:bg-surface-sunken disabled:text-ink-subtle disabled:cursor-not-allowed',
          'data-[placeholder]:text-ink-subtle',
          size === 'sm' ? 'h-10' : 'h-11',
          invalid
            ? 'ring-danger focus:ring-danger'
            : 'ring-hairline hover:ring-ink-subtle/40 focus:ring-accent',
          className,
        )}
      >
        {icon && <span className="text-ink-subtle shrink-0">{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-left">
          {/* The label is passed in rather than left to Radix: it resolves the
              text from the matching Item, which only mounts while the menu is
              open, so a saved value rendered as blank until first opened. */}
          <RadixSelect.Value placeholder={placeholder}>
            {selected?.label}
          </RadixSelect.Value>
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDown
            className="text-ink-subtle size-4 shrink-0"
            aria-hidden
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'border-hairline bg-surface-raised z-50 overflow-hidden rounded-xl border shadow-lg',
            'data-[state=open]:animate-fade-in',
            'w-[var(--radix-select-trigger-width)]',
            'max-h-[min(20rem,var(--radix-select-content-available-height))]',
          )}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toRadix(option.value)}
                className={cn(
                  'text-ink-muted relative flex cursor-pointer items-start gap-2 rounded-lg py-2 pr-2 pl-8 text-sm',
                  'outline-none select-none',
                  'data-[highlighted]:bg-surface-sunken data-[highlighted]:text-ink',
                  'data-[state=checked]:text-ink data-[state=checked]:font-medium',
                )}
              >
                <RadixSelect.ItemIndicator className="text-accent-text absolute left-2 top-2.5">
                  <Check className="size-4" aria-hidden />
                </RadixSelect.ItemIndicator>
                <span className="min-w-0">
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  {option.description && (
                    <span className="text-ink-subtle mt-0.5 block text-xs">
                      {option.description}
                    </span>
                  )}
                </span>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
