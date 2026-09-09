import { useMutation } from '@tanstack/react-query';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Images,
  Lock,
  Mail,
  Newspaper,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { loginErrorMessage } from '../features/auth/loginError.js';
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

export function LoginPage() {
  const { user, isLoading, setUser, signOutReason, clearSignOutReason } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: (loggedIn) => {
      setUser(loggedIn);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    },
  });

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    login.mutate();
  }

  /** Editing after a rejection clears it, so the form never shows an error
   * that no longer describes what is in the fields. */
  function edit(setter: (value: string) => void) {
    return (event: { target: { value: string } }) => {
      if (login.error) login.reset();
      if (signOutReason) clearSignOutReason();
      setter(event.target.value);
    };
  }

  const errorMessage = loginErrorMessage(login.error);
  const expiredNotice =
    !errorMessage && signOutReason === 'expired'
      ? 'Your session expired. Sign in again to continue.'
      : null;

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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  icon={<Lock className="size-4" aria-hidden />}
                  value={password}
                  onChange={edit(setPassword)}
                  invalid={Boolean(errorMessage)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-subtle hover:text-ink-muted"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </Field>

            {expiredNotice && (
              <p className="bg-warn-soft text-warn-text animate-fade-in rounded-lg px-3 py-2 text-sm">
                {expiredNotice}
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
              Sign in
              {!login.isPending && (
                <ArrowRight className="size-4" aria-hidden />
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
