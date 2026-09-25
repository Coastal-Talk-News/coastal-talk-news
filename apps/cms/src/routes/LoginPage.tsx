import type { CmsUserDto } from '@coastal-talk-news/types';
import { Images, Newspaper, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CredentialsForm } from '../features/auth/CredentialsForm.js';
import { SignInSetup } from '../features/auth/SignInSetup.js';
import { TwoFactorChallenge } from '../features/auth/TwoFactorChallenge.js';
import { useAuth } from '../features/auth/useAuth.js';

const HIGHLIGHTS = [
  {
    icon: Newspaper,
    title: 'Create & Publish',
    description: 'Share stories that matter',
  },
  {
    icon: Images,
    title: 'Manage Media',
    description: 'Keep your assets organised',
  },
  {
    icon: Users,
    title: 'Stay Consistent',
    description: 'One newsroom, one voice',
  },
];

/** Signing in is two steps that always run in this order. */
type Stage = 'credentials' | 'verify' | 'setup';

export function LoginPage() {
  const { user, isLoading, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  function enter(signedIn: CmsUserDto) {
    setUser(signedIn);
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== '/login' ? from : '/', { replace: true });
  }

  /** Sent back to the password because the pending sign-in ran out. */
  function restart(message: string) {
    setNotice(message);
    setStage('credentials');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between p-12 lg:flex">
        <div>
          <p className="text-2xl font-bold tracking-tight text-ink">
            Coastal Talk<span className="text-accent-text"> News</span>
          </p>
          <p className="mt-0.5 text-[11px] tracking-[0.2em] text-ink-subtle uppercase">
            CMS
          </p>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold tracking-[0.2em] text-ink-subtle uppercase">
            Local news. Greater tomorrow.
          </p>
          <div className="bg-accent my-5 h-0.5 w-10 rounded-full" />
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-ink">
            News that keeps your community informed.
          </h1>
          <p className="mt-4 text-ink-muted">
            A simple, focused newsroom CMS to create, manage and publish local
            news.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-ink-muted border-hairline border">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {title}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs tracking-wider text-ink-subtle uppercase">
          Covering your town. Your people. Your stories.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md border-hairline rounded-2xl border bg-surface p-8 shadow-sm lg:p-10">
          {stage === 'credentials' && (
            <CredentialsForm
              notice={notice}
              onContinue={(status, typedEmail) => {
                setEmail(typedEmail);
                setNotice(null);
                setStage(status === 'two_factor_required' ? 'verify' : 'setup');
              }}
            />
          )}

          {stage === 'verify' && (
            <TwoFactorChallenge
              onSignedIn={(result) => {
                enter(result.user);
                if (result.usedRecoveryCode) {
                  toast.warning('You signed in with a recovery code', {
                    description: `${result.recoveryCodesRemaining} left. You can create new ones in Settings, under Password & Security.`,
                  });
                }
              }}
              onRestart={restart}
              onBack={() => setStage('credentials')}
            />
          )}

          {stage === 'setup' && (
            <SignInSetup email={email} onDone={enter} onRestart={restart} />
          )}
        </div>
      </section>
    </div>
  );
}
