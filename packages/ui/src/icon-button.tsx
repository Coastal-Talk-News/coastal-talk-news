import type { ComponentPropsWithRef } from 'react';
import { cn } from './cn.js';

type Tone = 'default' | 'accent' | 'danger';

const TONES: Record<Tone, string> = {
  default:
    'text-ink-muted ring-hairline hover:bg-surface-sunken hover:text-ink hover:ring-ink-subtle/40',
  accent:
    'text-accent-text ring-accent/30 bg-accent-soft/50 hover:bg-accent-soft hover:ring-accent/50',
  danger:
    'text-danger-text ring-danger/25 hover:bg-danger-soft hover:ring-danger/40',
};

export function iconButtonClass(tone: Tone = 'default', className?: string) {
  return cn(
    'grid size-9 place-items-center rounded-lg ring-1',
    'transition-[background-color,color,box-shadow] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent',
    TONES[tone],
    className,
  );
}

interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  label: string;
  tone?: Tone;
}

export function IconButton({
  label,
  tone = 'default',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      aria-label={label}
      className={iconButtonClass(tone, className)}
    />
  );
}
