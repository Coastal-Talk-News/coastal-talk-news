import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { Field } from '@coastal-talk-news/ui/field';
import { PASSWORD_MAX_BYTES } from '@coastal-talk-news/validation/limits';
import {
  PASSWORD_RULES,
  unmetPasswordRules,
} from '@coastal-talk-news/validation/password-policy';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Check, Circle, ShieldCheck } from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth.js';
import { ApiError } from '../../api/client.js';
import { PasswordInput } from '../../components/PasswordInput.js';
import { useAuth } from '../auth/useAuth.js';

const encoder = new TextEncoder();

function Rule({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 text-xs transition-colors',
        met ? 'text-success-text' : 'text-ink-subtle',
      )}
    >
      {met ? (
        <Check className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <Circle className="size-3.5 shrink-0" aria-hidden />
      )}
      {children}
      <span className="sr-only">{met ? '(done)' : '(not yet)'}</span>
    </li>
  );
}

function failureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 429
      ? 'Too many attempts. Wait a few minutes before trying again.'
      : error.message;
  }
  return 'Could not change your password. Please try again.';
}

function successDescription(revokedSessions: number): string {
  if (revokedSessions === 0) return 'You are still signed in on this device.';
  const others =
    revokedSessions === 1
      ? '1 other device was'
      : `${revokedSessions} other devices were`;
  return `You are still signed in here. ${others} signed out.`;
}

export function SettingsSecurityForm() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const currentRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: ({ revokedSessions }) => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setConfirmTouched(false);
      toast.success('Password updated', {
        description: successDescription(revokedSessions),
      });
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.code === 'INVALID_CURRENT_PASSWORD'
      ) {
        setCurrentError('That is not your current password.');
        currentRef.current?.focus();
        return;
      }
      setFormError(failureMessage(error));
    },
  });

  // Passwords are compared exactly as typed: a space is a legitimate character.
  const meetsPolicy = unmetPasswordRules(newPassword).length === 0;
  const tooLong = encoder.encode(newPassword).length > PASSWORD_MAX_BYTES;
  const differs =
    currentPassword !== '' &&
    newPassword !== '' &&
    newPassword !== currentPassword;
  const matches = newPassword === confirmation;
  const canSubmit =
    currentPassword !== '' &&
    meetsPolicy &&
    !tooLong &&
    differs &&
    confirmation !== '' &&
    matches;

  const confirmError =
    confirmTouched && confirmation !== '' && !matches
      ? 'The two passwords do not match.'
      : undefined;

  // Any edit clears whatever the last attempt complained about.
  const edit =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setCurrentError(null);
      setFormError(null);
    };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    setFormError(null);
    mutation.mutate({ currentPassword, newPassword });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-ink text-lg font-semibold">Change password</h2>
        <p className="text-ink-muted mt-0.5 text-sm">
          Choose a password you don&rsquo;t use for anything else.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        {/* First in the source so it reads (and, stacked on a phone, sits)
            before the form; a wide screen moves it beside the form. */}
        <aside className="bg-surface-sunken border-hairline space-y-3 rounded-lg border p-4 lg:col-start-2 lg:row-start-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent size-4" aria-hidden />
            <h3 className="text-ink text-sm font-semibold">
              When you change it
            </h3>
          </div>
          <ul className="text-ink-muted list-disc space-y-1.5 pl-5 text-sm">
            <li>You stay signed in on this device.</li>
            <li>Every other device is signed out.</li>
            <li>Those devices sign back in with the new password.</li>
          </ul>
          <Link
            to="/sessions"
            className="text-accent-text inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Review signed-in devices
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 lg:col-start-1 lg:row-start-1"
          noValidate
        >
          {/* Lets a password manager tie the new password to this account. */}
          <input
            type="text"
            name="username"
            value={user?.email ?? ''}
            autoComplete="username"
            readOnly
            tabIndex={-1}
            aria-hidden
            className="sr-only"
          />

          <Field
            label="Current password"
            htmlFor="security-current-password"
            required
            error={currentError ?? undefined}
          >
            <PasswordInput
              id="security-current-password"
              ref={currentRef}
              name="current-password"
              autoComplete="current-password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={edit(setCurrentPassword)}
              invalid={Boolean(currentError)}
            />
          </Field>

          <div className="space-y-3">
            <Field
              label="New password"
              htmlFor="security-new-password"
              required
              error={
                tooLong
                  ? `Use no more than ${PASSWORD_MAX_BYTES} characters (some symbols count as more than one).`
                  : undefined
              }
            >
              <PasswordInput
                id="security-new-password"
                name="new-password"
                autoComplete="new-password"
                aria-describedby="security-password-rules"
                placeholder="Enter a new password"
                value={newPassword}
                onChange={edit(setNewPassword)}
                invalid={tooLong}
              />
            </Field>

            <div
              id="security-password-rules"
              className="bg-surface-sunken rounded-lg px-3.5 py-3"
            >
              <p className="text-ink-muted mb-2 text-xs font-medium">
                Your new password needs
              </p>
              <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => (
                  <Rule key={rule.id} met={rule.test(newPassword)}>
                    {rule.label}
                  </Rule>
                ))}
                <Rule met={differs}>Different from your current password</Rule>
              </ul>
            </div>
          </div>

          <Field
            label="Confirm new password"
            htmlFor="security-confirm-password"
            required
            error={confirmError}
          >
            <PasswordInput
              id="security-confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Re-enter the new password"
              value={confirmation}
              onChange={edit(setConfirmation)}
              onBlur={() => setConfirmTouched(true)}
              invalid={Boolean(confirmError)}
            />
          </Field>

          {formError && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-text animate-fade-in rounded-lg px-3 py-2 text-sm"
            >
              {formError}
            </p>
          )}

          <div className="border-hairline flex justify-end border-t pt-6">
            <Button
              type="submit"
              data-shortcut="save"
              loading={mutation.isPending}
              disabled={!canSubmit}
            >
              Update password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
