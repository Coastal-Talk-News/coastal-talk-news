import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from './cn.js';

interface InputProps extends ComponentPropsWithRef<'input'> {
  icon?: ReactNode;
  invalid?: boolean;
}

export function Input({ icon, invalid, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="text-ink-subtle pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {icon}
        </span>
      )}
      <input
        {...props}
        aria-invalid={invalid || undefined}
        className={cn(
          'text-ink bg-surface h-11 w-full rounded-lg px-3 text-sm ring-1',
          'transition-[box-shadow,background-color] duration-150',
          'placeholder:text-ink-subtle focus:ring-2 focus:outline-none',
          'disabled:bg-surface-sunken disabled:text-ink-subtle',
          invalid
            ? 'ring-danger focus:ring-danger'
            : 'ring-hairline hover:ring-ink-subtle/40 focus:ring-accent',
          icon && 'pl-10',
          className,
        )}
      />
    </div>
  );
}
