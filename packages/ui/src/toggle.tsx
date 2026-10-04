import * as Switch from '@radix-ui/react-switch';
import { cn } from './cn.js';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label': string;
}

export function Toggle({
  checked,
  onCheckedChange,
  disabled,
  ...props
}: ToggleProps) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={props['aria-label']}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-ink-subtle/40 hover:bg-ink-subtle/60',
      )}
    >
      <Switch.Thumb
        className={cn(
          'block size-5 translate-x-0.5 rounded-full shadow-sm transition-[transform,background-color] duration-200 data-[state=checked]:translate-x-[22px]',
          // Plain white always reads against the unchecked track (a muted
          // ink-subtle tint, never literally white itself), but the checked
          // track is --accent, which some themes set close to white in dark
          // mode (Graphite) - accent-fg is the token already designed to
          // stay readable against --accent in every theme, so the thumb
          // uses it only once it actually needs to.
          checked ? 'bg-accent-fg' : 'bg-white',
        )}
      />
    </Switch.Root>
  );
}
