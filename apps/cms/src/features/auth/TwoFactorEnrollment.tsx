import type { TwoFactorEnrollmentDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { Field } from '@coastal-talk-news/ui/field';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CopyButton } from '../../components/CopyButton.js';
import { OTP_LENGTH, OtpInput } from './OtpInput.js';
import { QrCode } from './QrCode.js';
import { RecoveryCodes } from './RecoveryCodes.js';
import { describeTwoFactorError } from './twoFactorError.js';

type Step = 'scan' | 'verify' | 'codes';

const STEPS: { id: Step; label: string; title: string }[] = [
  { id: 'scan', label: 'Scan', title: 'Scan the QR code' },
  { id: 'verify', label: 'Verify', title: 'Enter the code' },
  { id: 'codes', label: 'Save codes', title: 'Save your recovery codes' },
];

/** The same three steps, in the same order, every time: scan, prove, keep. */
function Progress({ current }: { current: number }) {
  return (
    <ol aria-label="Setup progress" className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full text-xs font-semibold transition-colors',
                done && 'bg-success-soft text-success-text',
                active && 'bg-accent text-accent-fg',
                !done && !active && 'bg-surface-sunken text-ink-subtle',
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                active ? 'text-ink' : 'text-ink-subtle',
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="bg-hairline mx-1 h-px w-5" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface TwoFactorEnrollmentProps {
  enrollment: TwoFactorEnrollmentDto;
  /** Shown in the downloaded recovery-codes file. */
  email?: string;
  /** Checks the code and resolves with the new recovery codes. */
  onConfirm: (code: string) => Promise<string[]>;
  finishLabel: string;
  onFinish: () => void;
  /** The setup ran out and has to begin again. */
  onRestart: (message: string) => void;
}

/**
 * Setting up an authenticator: scan, prove it works, keep the recovery codes.
 * Used both when signing in for the first time and when moving to a new phone,
 * which is why it knows nothing about either.
 */
export function TwoFactorEnrollment({
  enrollment,
  email,
  onConfirm,
  finishLabel,
  onFinish,
  onRestart,
}: TwoFactorEnrollmentProps) {
  const [step, setStep] = useState<Step>('scan');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const confirm = useMutation({
    mutationFn: onConfirm,
    onSuccess: (codes) => {
      setRecoveryCodes(codes);
      setStep('codes');
    },
    onError: (failure) => {
      const described = describeTwoFactorError(failure);
      if (described.restart) return onRestart(described.message);
      setError(described.message);
      setCode('');
    },
  });

  function submit(value: string) {
    if (confirm.isPending) return;
    setError(undefined);
    confirm.mutate(value);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (code.length === OTP_LENGTH) submit(code);
  }

  const current = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Progress current={current} />
        <h2 className="text-ink text-2xl font-bold tracking-tight">
          {STEPS[current]?.title}
        </h2>
      </div>

      {step === 'scan' && (
        <div className="space-y-5">
          <p className="text-ink-muted text-sm">
            Open an authenticator app such as Google Authenticator, Microsoft
            Authenticator, Authy or 1Password, and scan this code to add your
            newsroom account.
          </p>
          <div className="flex justify-center">
            <QrCode value={enrollment.otpauthUri} />
          </div>
          <div className="bg-surface-sunken rounded-lg p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-ink-subtle text-xs">
                Can&rsquo;t scan it? Enter this key in your app instead.
              </p>
              <CopyButton text={enrollment.secret} />
            </div>
            {/* One unbroken line so it reads, and is typed, as a single key. */}
            <code className="text-ink mt-2 block overflow-x-auto font-mono text-xs whitespace-nowrap sm:text-sm">
              {enrollment.secret}
            </code>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => setStep('verify')}
          >
            I&rsquo;ve added it, continue
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Field
            label="Authentication code"
            htmlFor="setup-code"
            error={error}
            hint={
              error
                ? undefined
                : 'Enter the 6-digit code your app now shows for Coastal Talk News.'
            }
          >
            <OtpInput
              id="setup-code"
              value={code}
              onChange={(next) => {
                setCode(next);
                setError(undefined);
              }}
              onComplete={submit}
              invalid={Boolean(error)}
              autoFocus
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep('scan');
                setError(undefined);
                setCode('');
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={confirm.isPending}
              disabled={code.length !== OTP_LENGTH}
            >
              Verify and continue
            </Button>
          </div>
        </form>
      )}

      {step === 'codes' && (
        <RecoveryCodes
          codes={recoveryCodes}
          email={email}
          confirmLabel={finishLabel}
          onConfirm={onFinish}
        />
      )}
    </div>
  );
}
