import type { CmsUserDto } from '@coastal-talk-news/types';
import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { authApi } from '../../api/auth.js';
import { TwoFactorEnrollment } from './TwoFactorEnrollment.js';
import { describeTwoFactorError } from './twoFactorError.js';

interface SignInSetupProps {
  email: string;
  onDone: (user: CmsUserDto) => void;
  onRestart: (message: string) => void;
}

/**
 * The first sign-in of an account that hasn't set up two-factor. The API has
 * already opened nothing for this person: their session appears at the moment
 * the first code is confirmed, and is only handed to the app once they have
 * taken their recovery codes.
 */
export function SignInSetup({ email, onDone, onRestart }: SignInSetupProps) {
  const signedIn = useRef<CmsUserDto | null>(null);

  // Asking again returns the same secret, so a remount can't strand a code
  // that was already added to an authenticator app.
  const enrollment = useQuery({
    queryKey: ['two-factor', 'sign-in-setup'],
    queryFn: authApi.twoFactor.beginSetup,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  const failure = useMemo(
    () => (enrollment.error ? describeTwoFactorError(enrollment.error) : null),
    [enrollment.error],
  );
  useEffect(() => {
    if (failure?.restart) onRestart(failure.message);
  }, [failure, onRestart]);

  if (enrollment.isPending)
    return <LoadingState label="Preparing your setup…" />;
  if (enrollment.isError) {
    return (
      <ErrorState
        message={failure?.message ?? 'Could not start setup.'}
        onRetry={() => void enrollment.refetch()}
      />
    );
  }

  return (
    <TwoFactorEnrollment
      enrollment={enrollment.data}
      email={email}
      onConfirm={async (code) => {
        const result = await authApi.twoFactor.confirmSetup(code);
        signedIn.current = result.user;
        return result.recoveryCodes;
      }}
      finishLabel="Continue to dashboard"
      onFinish={() => {
        if (signedIn.current) onDone(signedIn.current);
      }}
      onRestart={onRestart}
    />
  );
}
