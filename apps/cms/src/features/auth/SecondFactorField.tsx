import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { KeyRound } from 'lucide-react';
import type { Ref } from 'react';
import { OtpInput } from './OtpInput.js';

export type SecondFactorMode = 'code' | 'recovery';

interface SecondFactorFieldProps {
  id: string;
  mode: SecondFactorMode;
  onModeChange: (mode: SecondFactorMode) => void;
  value: string;
  onChange: (value: string) => void;
  /** Called when a full authenticator code has been typed or pasted. */
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Either kind of second factor, in one place: a six-digit authenticator code
 * by default, and a recovery code for the person whose phone is gone. The
 * switch between them is a plain link, so the common path stays uncluttered.
 */
export function SecondFactorField({
  id,
  mode,
  onModeChange,
  value,
  onChange,
  onComplete,
  error,
  disabled,
  autoFocus,
  inputRef,
}: SecondFactorFieldProps) {
  const isCode = mode === 'code';

  return (
    <div className="space-y-2.5">
      <Field
        label={isCode ? 'Authentication code' : 'Recovery code'}
        htmlFor={id}
        error={error}
        hint={
          error
            ? undefined
            : isCode
              ? 'Open your authenticator app and enter the 6-digit code.'
              : 'Enter one of the recovery codes you saved. Each works once.'
        }
      >
        {isCode ? (
          <OtpInput
            id={id}
            ref={inputRef}
            value={value}
            onChange={onChange}
            onComplete={onComplete}
            invalid={Boolean(error)}
            disabled={disabled}
            autoFocus={autoFocus}
          />
        ) : (
          <Input
            id={id}
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            placeholder="XXXXX-XXXXX"
            icon={<KeyRound className="size-4" aria-hidden />}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={14}
            invalid={Boolean(error)}
            disabled={disabled}
            autoFocus={autoFocus}
            className="font-mono tracking-wider"
          />
        )}
      </Field>

      <button
        type="button"
        onClick={() => onModeChange(isCode ? 'recovery' : 'code')}
        className="text-accent-text text-sm font-medium hover:underline"
      >
        {isCode
          ? 'Lost your device? Use a recovery code'
          : 'Use my authenticator app instead'}
      </button>
    </div>
  );
}
