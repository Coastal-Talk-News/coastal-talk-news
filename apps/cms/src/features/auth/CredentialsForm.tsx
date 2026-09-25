import type { LoginStatus } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { authApi } from '../../api/auth.js';
import { PasswordInput } from '../../components/PasswordInput.js';
import { loginErrorMessage } from './loginError.js';
import { useAuth } from './useAuth.js';

interface CredentialsFormProps {
  /** Email and password were right; the second step is what the status names. */
  onContinue: (status: LoginStatus, email: string) => void;
  /** Why the person is back here, when they were sent back mid-way. */
  notice?: string | null;
}

export function CredentialsForm({ onContinue, notice }: CredentialsFormProps) {
  const { signOutReason, clearSignOutReason } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(true);

  const login = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: ({ status }) => onContinue(status, email.trim()),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    login.mutate();
  }

  function edit(setter: (value: string) => void) {
    return (event: { target: { value: string } }) => {
      if (login.error) login.reset();
      if (signOutReason) clearSignOutReason();
      setNoticeVisible(false);
      setter(event.target.value);
    };
  }

  const errorMessage = loginErrorMessage(login.error);
  const banner =
    errorMessage === null
      ? ((noticeVisible ? notice : null) ??
        (signOutReason === 'expired'
          ? 'Your session expired. Sign in again to continue.'
          : null))
      : null;

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-ink">
        Welcome back
      </h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Sign in to access your newsroom.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@coastaltalknews.com"
            icon={<Mail className="size-4" aria-hidden />}
            value={email}
            onChange={edit(setEmail)}
            invalid={Boolean(errorMessage)}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={edit(setPassword)}
            invalid={Boolean(errorMessage)}
          />
        </Field>

        {banner && (
          <p className="bg-warn-soft text-warn-text animate-fade-in rounded-lg px-3 py-2 text-sm">
            {banner}
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="bg-danger-soft text-danger-text animate-fade-in rounded-lg px-3 py-2 text-sm"
          >
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={login.isPending}
          disabled={!email.trim() || !password}
        >
          Continue
          {!login.isPending && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </form>
    </div>
  );
}
