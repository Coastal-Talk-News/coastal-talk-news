import { cn } from '@coastal-talk-news/ui/cn';
import { Input } from '@coastal-talk-news/ui/input';
import type { ChangeEvent, ComponentProps } from 'react';

export const OTP_LENGTH = 6;

type OtpInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'icon' | 'value' | 'onChange'
> & {
  value: string;
  onChange: (value: string) => void;
  /** Fires the moment the last digit lands, typed, pasted or autofilled. */
  onComplete?: (value: string) => void;
};

/**
 * One field rather than six boxes: pasting a code, an autofill from a phone
 * and a password manager all just work, and a screen reader sees a single
 * input. Anything that isn't a digit is dropped, so "123 456" pastes cleanly.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  className,
  ...props
}: OtpInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(digits);
    if (digits.length === OTP_LENGTH) onComplete?.(digits);
  }

  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      placeholder="000000"
      spellCheck={false}
      {...props}
      value={value}
      onChange={handleChange}
      // The trailing space in letter-spacing would push the digits left of
      // centre; the matching left padding puts them back.
      className={cn(
        'h-14 pl-[0.5em] text-center font-mono text-2xl tracking-[0.5em] tabular-nums placeholder:tracking-[0.5em]',
        className,
      )}
    />
  );
}
