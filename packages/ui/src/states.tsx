import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './button.js';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="text-ink-muted animate-fade-in flex items-center justify-center gap-2 py-16 text-sm"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="animate-fade-in flex flex-col items-center gap-3 py-16 text-center"
    >
      <div className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertCircle className="size-6" aria-hidden />
      </div>
      <p className="text-ink-muted max-w-sm text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-ink-subtle mb-1 grid size-12 place-items-center rounded-full bg-surface-sunken">
        {icon}
      </div>
      <h3 className="text-ink text-sm font-semibold">{title}</h3>
      <p className="text-ink-muted max-w-sm text-sm">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
