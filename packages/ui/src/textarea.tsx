import type { ComponentPropsWithRef } from 'react';
import { cn } from './cn.js';

interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  invalid?: boolean;
  showCount?: boolean;
}

export function Textarea({
  invalid,
  showCount,
  className,
  maxLength,
  value,
  ...props
}: TextareaProps) {
  const used = typeof value === 'string' ? value.length : 0;

  return (
    <div className="space-y-1.5">
      <textarea
        {...props}
        value={value}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        className={cn(
          'text-ink bg-surface w-full resize-none rounded-lg px-3 py-2.5 text-sm ring-1',
          'transition-[box-shadow,background-color] duration-150',
          'placeholder:text-ink-subtle focus:ring-2 focus:outline-none',
          'disabled:bg-surface-sunken disabled:text-ink-subtle',
          invalid
            ? 'ring-danger focus:ring-danger'
            : 'ring-hairline hover:ring-ink-subtle/40 focus:ring-accent',
          className,
        )}
      />
      {showCount && maxLength && (
        <p className="text-ink-subtle text-right text-xs tabular-nums">
          {used}/{maxLength}
        </p>
      )}
    </div>
  );
}
