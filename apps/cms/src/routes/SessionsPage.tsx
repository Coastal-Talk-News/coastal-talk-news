import type { SessionDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Skeleton } from '@coastal-talk-news/ui/skeleton';
import { EmptyState, ErrorState } from '@coastal-talk-news/ui/states';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { useAuth } from '../features/auth/useAuth.js';
import { formatDate, formatRelative } from '../lib/format.js';

function describeDevice(userAgent: string | null) {
  const ua = userAgent ?? '';
  if (/iPhone|Android.*Mobile/i.test(ua))
    return { icon: Smartphone, label: 'Phone' };
  if (/iPad|Tablet/i.test(ua)) return { icon: Tablet, label: 'Tablet' };
  return { icon: Monitor, label: 'Computer' };
}

function browserOf(userAgent: string | null): string {
  const ua = userAgent ?? '';
  for (const name of ['Edg', 'Chrome', 'Firefox', 'Safari']) {
    if (ua.includes(name)) return name === 'Edg' ? 'Edge' : name;
  }
  return 'Unknown browser';
}

export function SessionsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [pendingSignOut, setPendingSignOut] = useState<SessionDto | null>(null);
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: ({ signal }) => authApi.sessions(signal),
    staleTime: 10_000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions });

  const signOutDevice = useMutation({
    mutationFn: (session: SessionDto) => authApi.revokeSession(session.id),
    onSuccess: async (_result, session) => {
      if (session.isCurrent) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }
      void refresh();
      toast.success('Device signed out.');
    },
    onError: (mutationError) =>
      toast.error(
        mutationError instanceof ApiError
          ? mutationError.message
          : 'Could not sign out that device.',
      ),
  });

  const signOutOthers = useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: ({ revoked }) => {
      void refresh();
      toast.success(
        revoked === 0
          ? 'No other devices were signed in.'
          : `Signed out ${revoked} other device${revoked === 1 ? '' : 's'}.`,
      );
    },
    onError: () => toast.error('Could not sign out the other devices.'),
  });

  const others = data?.filter((session) => !session.isCurrent) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Signed-in devices"
        description="Devices currently signed in to your account. Sign out anything you don't recognise."
        actions={
          <Button
            variant="secondary"
            onClick={() => setConfirmSignOutAll(true)}
            disabled={others.length === 0 || signOutOthers.isPending}
            loading={signOutOthers.isPending}
          >
            Sign out other devices
          </Button>
        }
      />

      <section className="border-hairline rounded-card bg-surface overflow-hidden border shadow-sm">
        {isPending ? (
          <div className="divide-hairline divide-y">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 p-4">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : 'Could not load your devices.'
            }
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Monitor className="size-5" aria-hidden />}
            title="No devices signed in"
            description="Devices you sign in from will be listed here."
          />
        ) : (
          <ul className="divide-hairline divide-y">
            {data.map((session) => {
              const { icon: Icon, label } = describeDevice(session.userAgent);
              return (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center gap-4 p-4"
                >
                  <span className="bg-surface-sunken text-ink-muted grid size-10 shrink-0 place-items-center rounded-xl">
                    <Icon className="size-5" aria-hidden />
                  </span>

                  <div className="min-w-56 flex-1">
                    <p className="text-ink flex items-center gap-2 text-sm font-medium">
                      {label} &middot; {browserOf(session.userAgent)}
                      {session.isCurrent && (
                        <Badge tone="green">This device</Badge>
                      )}
                    </p>
                    <p className="text-ink-muted mt-0.5 text-xs">
                      Last active {formatRelative(session.lastSeenAt)} &middot;
                      signed in {formatDate(session.createdAt)}
                    </p>
                  </div>

                  <Button
                    variant={session.isCurrent ? 'secondary' : 'danger'}
                    size="sm"
                    onClick={() => setPendingSignOut(session)}
                    loading={
                      signOutDevice.isPending &&
                      signOutDevice.variables?.id === session.id
                    }
                  >
                    Sign out
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingSignOut !== null}
        onOpenChange={(open) => !open && setPendingSignOut(null)}
        title={
          pendingSignOut?.isCurrent
            ? 'Sign out of this device?'
            : 'Sign out this device?'
        }
        description={
          pendingSignOut?.isCurrent
            ? 'You will be returned to the sign-in page.'
            : 'That device will be signed out straight away and will need to sign in again.'
        }
        confirmLabel="Sign out"
        loading={signOutDevice.isPending}
        onConfirm={() => {
          if (!pendingSignOut) return;
          signOutDevice.mutate(pendingSignOut, {
            onSettled: () => setPendingSignOut(null),
          });
        }}
      />

      <ConfirmDialog
        open={confirmSignOutAll}
        onOpenChange={setConfirmSignOutAll}
        title="Sign out other devices?"
        description={`This signs out ${others.length} other device${others.length === 1 ? '' : 's'}. This one stays signed in.`}
        confirmLabel="Sign them out"
        loading={signOutOthers.isPending}
        onConfirm={() =>
          signOutOthers.mutate(undefined, {
            onSettled: () => setConfirmSignOutAll(false),
          })
        }
      />
    </>
  );
}
