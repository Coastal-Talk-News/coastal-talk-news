import * as Label from '@radix-ui/react-label';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  children,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label.Root
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink-muted"
      >
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
        {optional && (
          <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
        )}
      </Label.Root>
      {children}
      {error ? (
        <p className="animate-fade-in text-xs text-danger-text">{error}</p>
      ) : (
        hint && <p className="text-ink-muted text-xs">{hint}</p>
      )}
    </div>
  );
}
