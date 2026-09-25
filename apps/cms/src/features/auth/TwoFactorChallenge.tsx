import type { TwoFactorSignInDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { authApi } from '../../api/auth.js';
import { OTP_LENGTH } from './OtpInput.js';
import {
  SecondFactorField,
  type SecondFactorMode,
} from './SecondFactorField.js';
import { describeTwoFactorError } from './twoFactorError.js';

interface TwoFactorChallengeProps {
  onSignedIn: (result: TwoFactorSignInDto) => void;
  /** The pending sign-in ran out; the password has to be entered again. */
  onRestart: (message: string) => void;
  onBack: () => void;
}

/** A recovery code is ten letters and digits; the dash is only for reading. */
function isCompleteRecoveryCode(value: string): boolean {
  return value.replace(/[^A-Za-z0-9]/g, '').length >= 10;
}

export function TwoFactorChallenge({
  onSignedIn,
  onRestart,
  onBack,
}: TwoFactorChallengeProps) {
  const [mode, setMode] = useState<SecondFactorMode>('code');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const verify = useMutation({
    mutationFn: authApi.twoFactor.verify,
    onSuccess: onSignedIn,
    onError: (failure) => {
      const described = describeTwoFactorError(failure);
      if (described.restart) return onRestart(described.message);
      setError(described.message);
      // Ready for the next try without another click.
      setValue('');
      inputRef.current?.focus();
    },
  });

  function submit(code: string) {
    if (verify.isPending) return;
    setError(undefined);
    verify.mutate(code);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) submit(value);
  }

  function changeMode(next: SecondFactorMode) {
    setMode(next);
    setValue('');
    setError(undefined);
  }

  const canSubmit =
    mode === 'code'
      ? value.length === OTP_LENGTH
      : isCompleteRecoveryCode(value);

  return (
    <div>
      <div className="bg-accent-soft text-accent-text grid size-12 place-items-center rounded-xl">
        <ShieldCheck className="size-6" aria-hidden />
      </div>
      <h2 className="text-ink mt-5 text-3xl font-bold tracking-tight">
        Two-step verification
      </h2>
      <p className="text-ink-muted mt-1.5 text-sm">
        One more step to keep your newsroom secure.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <SecondFactorField
          id="two-factor-code"
          mode={mode}
          onModeChange={changeMode}
          value={value}
          onChange={(next) => {
            setValue(next);
            setError(undefined);
          }}
          onComplete={submit}
          error={error}
          inputRef={inputRef}
          autoFocus
        />

        <Button
          type="submit"
          className="w-full"
          loading={verify.isPending}
          disabled={!canSubmit}
        >
          Verify
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="text-ink-muted hover:text-ink mt-6 inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sign in
      </button>
    </div>
  );
}
