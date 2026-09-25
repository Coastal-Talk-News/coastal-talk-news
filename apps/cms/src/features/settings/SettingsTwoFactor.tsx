import type { TwoFactorEnrollmentDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Button } from '@coastal-talk-news/ui/button';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth.js';
import { queryKeys } from '../../api/queryKeys.js';
import { formatDate } from '../../lib/format.js';
import { RecoveryCodes } from '../auth/RecoveryCodes.js';
import { TwoFactorEnrollment } from '../auth/TwoFactorEnrollment.js';
import { useAuth } from '../auth/useAuth.js';
import { ReauthForm } from './ReauthForm.js';

/** Below this many, the page nudges towards making a new set. */
const LOW_RECOVERY_CODES = 3;

type Panel = 'codes' | 'reset' | null;

function Row({
  icon,
  title,
  detail,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <span className="bg-surface-sunken text-ink-muted grid size-10 shrink-0 place-items-center rounded-lg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-medium">{title}</p>
        <p className="text-ink-muted mt-0.5 text-sm">{detail}</p>
      </div>
      {action}
    </div>
  );
}

/** Closing a sheet that holds codes nobody has saved would lose them for good. */
function confirmDiscard(): boolean {
  return window.confirm(
    'Close without saving your recovery codes? They will not be shown again.',
  );
}

function RecoveryCodesSheet({
  open,
  onOpenChange,
  email,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  onGenerated: () => void;
}) {
  const [codes, setCodes] = useState<string[] | null>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && codes && !confirmDiscard()) return;
        onOpenChange(next);
      }}
      title="New recovery codes"
      description="Replace the codes you have with a fresh set."
    >
      {codes ? (
        <RecoveryCodes
          codes={codes}
          email={email}
          confirmLabel="Done"
          onConfirm={() => onOpenChange(false)}
        />
      ) : (
        <ReauthForm
          intro="Confirm it's you. Your current recovery codes stop working the moment you continue."
          submitLabel="Generate new codes"
          onSubmit={async (credentials) => {
            const result =
              await authApi.twoFactor.regenerateRecoveryCodes(credentials);
            setCodes(result.recoveryCodes);
            onGenerated();
          }}
        />
      )}
    </Sheet>
  );
}

function ResetAuthenticatorSheet({
  open,
  onOpenChange,
  email,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  onReset: (revokedSessions: number) => void;
}) {
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollmentDto | null>(
    null,
  );
  const [revokedSessions, setRevokedSessions] = useState(0);
  // Set once the new authenticator is saved, from which point closing loses codes.
  const [codesUnsaved, setCodesUnsaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && codesUnsaved && !confirmDiscard()) return;
        onOpenChange(next);
      }}
      title="Reset authenticator"
      description="Move to a new phone or authenticator app."
    >
      {enrollment ? (
        <TwoFactorEnrollment
          enrollment={enrollment}
          email={email}
          onConfirm={async (code) => {
            const result = await authApi.twoFactor.confirmReset(code);
            setRevokedSessions(result.revokedSessions);
            setCodesUnsaved(true);
            return result.recoveryCodes;
          }}
          finishLabel="Done"
          onFinish={() => {
            onReset(revokedSessions);
            onOpenChange(false);
          }}
          onRestart={(message) => {
            setEnrollment(null);
            setNotice(message);
          }}
        />
      ) : (
        <div className="space-y-4">
          {notice && (
            <p className="bg-warn-soft text-warn-text rounded-lg px-3 py-2 text-sm">
              {notice}
            </p>
          )}
          <ReauthForm
            intro="Confirm it's you first. Your current authenticator keeps working until the new one is set up, and other devices are signed out when you finish."
            submitLabel="Continue"
            onSubmit={async (credentials) => {
              setEnrollment(await authApi.twoFactor.beginReset(credentials));
              setNotice(null);
            }}
          />
        </div>
      )}
    </Sheet>
  );
}

export function SettingsTwoFactor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<Panel>(null);

  const status = useQuery({
    queryKey: queryKeys.twoFactor,
    queryFn: ({ signal }) => authApi.twoFactor.status(signal),
  });

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.twoFactor });

  const remaining = status.data?.recoveryCodesRemaining ?? 0;
  const running = remaining <= LOW_RECOVERY_CODES;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-ink text-lg font-semibold">
          Two-factor authentication
        </h2>
        <p className="text-ink-muted mt-0.5 text-sm">
          Signing in needs a code from your authenticator app as well as your
          password.
        </p>
      </div>

      {status.isPending && <LoadingState label="Loading…" />}
      {status.isError && (
        <ErrorState
          message="Could not load your two-factor settings."
          onRetry={() => void status.refetch()}
        />
      )}

      {status.data && (
        <div className="border-hairline divide-hairline divide-y rounded-lg border">
          <Row
            icon={<ShieldCheck className="size-5" aria-hidden />}
            title="Authenticator app"
            detail={
              <>
                <Badge tone="green" dot>
                  On
                </Badge>{' '}
                <span className="ml-1">
                  since {formatDate(status.data.enabledAt)}
                </span>
              </>
            }
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPanel('reset')}
              >
                Reset authenticator
              </Button>
            }
          />
          <Row
            icon={<KeyRound className="size-5" aria-hidden />}
            title="Recovery codes"
            detail={
              <span className={running ? 'text-warn-text' : undefined}>
                {remaining} of 10 left
                {running && remaining > 0 && ' - running low'}
                {remaining === 0 && ' - make a new set'}
              </span>
            }
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPanel('codes')}
              >
                Generate new codes
              </Button>
            }
          />
        </div>
      )}

      <RecoveryCodesSheet
        open={panel === 'codes'}
        onOpenChange={(open) => setPanel(open ? 'codes' : null)}
        email={user?.email}
        onGenerated={refresh}
      />
      <ResetAuthenticatorSheet
        open={panel === 'reset'}
        onOpenChange={(open) => setPanel(open ? 'reset' : null)}
        email={user?.email}
        onReset={(revokedSessions) => {
          refresh();
          toast.success('Authenticator reset', {
            description:
              revokedSessions > 0
                ? `${revokedSessions === 1 ? '1 other device was' : `${revokedSessions} other devices were`} signed out.`
                : 'Your new authenticator is ready to use.',
          });
        }}
      />
    </section>
  );
}
