import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { KeyRound } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { OtpInput } from './OtpInput.js';

export type SecondFactorMode = 'code' | 'email' | 'recovery';

interface SecondFactorFieldProps {
  id: string;
  mode: SecondFactorMode;
  onModeChange: (mode: SecondFactorMode) => void;
  value: string;
  onChange: (value: string) => void;
  /** Called when a full code has been typed or pasted. */
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  /** Whether the server has email sign-in codes turned on at all - hides the
   *  "Use email instead" link when it doesn't. */
  emailOtpAvailable?: boolean;
  /** The send/resend status line - shown only in email mode, owned by the
   *  parent since sending is an API call this field knows nothing about. */
  emailStatus?: ReactNode;
}

const LABEL: Record<SecondFactorMode, string> = {
  code: 'Authentication code',
  email: 'Email code',
  recovery: 'Recovery code',
};

const HINT: Record<SecondFactorMode, string | undefined> = {
  code: 'Open your authenticator app and enter the 6-digit code.',
  // The status line next to the field covers this instead - it also has to
  // say "sending" before there is a code to describe.
  email: undefined,
  recovery: 'Enter one of the recovery codes you saved. Each works once.',
};

/**
 * Each second factor is its own separate screen - an authenticator code by
 * default, a mailed code, or a recovery code for the person whose phone is
 * gone - never mixed into one field a reader has to puzzle out. Switching
 * between them is a plain link, so the common path stays uncluttered.
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
  emailOtpAvailable,
  emailStatus,
}: SecondFactorFieldProps) {
  const isRecovery = mode === 'recovery';

  return (
    <div className="space-y-2.5">
      <Field
        label={LABEL[mode]}
        htmlFor={id}
        error={error}
        hint={error ? undefined : HINT[mode]}
      >
        {isRecovery ? (
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
        ) : (
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
        )}
      </Field>

      {mode === 'email' && !error && emailStatus}

      <div className="flex flex-col items-start gap-1.5">
        {mode === 'code' && emailOtpAvailable && (
          <button
            type="button"
            onClick={() => onModeChange('email')}
            className="text-accent-text text-sm font-medium hover:underline"
          >
            Use email instead
          </button>
        )}
        {mode === 'code' && (
          <button
            type="button"
            onClick={() => onModeChange('recovery')}
            className="text-accent-text text-sm font-medium hover:underline"
          >
            Lost your device? Use a recovery code
          </button>
        )}
        {(mode === 'email' || mode === 'recovery') && (
          <button
            type="button"
            onClick={() => onModeChange('code')}
            className="text-accent-text text-sm font-medium hover:underline"
          >
            Use authenticator app instead
          </button>
        )}
      </div>
    </div>
  );
}
