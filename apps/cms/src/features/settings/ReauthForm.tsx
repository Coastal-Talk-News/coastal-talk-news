import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PasswordInput } from '../../components/PasswordInput.js';
import { OTP_LENGTH } from '../auth/OtpInput.js';
import {
  SecondFactorField,
  type SecondFactorMode,
} from '../auth/SecondFactorField.js';
import { describeTwoFactorError } from '../auth/twoFactorError.js';

interface Credentials {
  password: string;
  code: string;
}

interface ReauthFormProps {
  intro: string;
  submitLabel: string;
  /** Resolves when the API accepted both; the caller moves on from there. */
  onSubmit: (credentials: Credentials) => Promise<void>;
}

/**
 * Two-factor settings can lock someone out of their own account, so changing
 * them asks for what a stolen session doesn't have: the password and a
 * current code (or a recovery code, for someone whose phone is already gone).
 */
export function ReauthForm({ intro, submitLabel, onSubmit }: ReauthFormProps) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<SecondFactorMode>('code');
  const [errors, setErrors] = useState<
    Partial<Record<'password' | 'code' | 'form', string>>
  >({});

  const mutation = useMutation({
    mutationFn: onSubmit,
    onError: (failure) => {
      const described = describeTwoFactorError(failure);
      setErrors({ [described.field]: described.message });
      if (described.field === 'code') setCode('');
    },
  });

  const codeReady =
    mode === 'code'
      ? code.length === OTP_LENGTH
      : code.replace(/[^A-Za-z0-9]/g, '').length >= 10;
  const canSubmit = password !== '' && codeReady;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    setErrors({});
    mutation.mutate({ password, code });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-ink-muted text-sm">{intro}</p>

      <Field
        label="Password"
        htmlFor="reauth-password"
        required
        error={errors.password}
      >
        <PasswordInput
          id="reauth-password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors({});
          }}
          invalid={Boolean(errors.password)}
          autoFocus
        />
      </Field>

      <SecondFactorField
        id="reauth-code"
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          setCode('');
          setErrors({});
        }}
        value={code}
        onChange={(next) => {
          setCode(next);
          setErrors({});
        }}
        error={errors.code}
      />

      {errors.form && (
        <p
          role="alert"
          className="bg-danger-soft text-danger-text animate-fade-in rounded-lg px-3 py-2 text-sm"
        >
          {errors.form}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        loading={mutation.isPending}
        disabled={!canSubmit}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
