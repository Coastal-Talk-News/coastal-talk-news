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
      <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
    </Switch.Root>
  );
}
