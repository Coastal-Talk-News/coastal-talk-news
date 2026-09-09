import { LoadingState } from '@coastal-talk-news/ui/states';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    // Keep search and hash, so signing back in returns to the exact view —
    // a filtered list stays filtered.
    const from = `${location.pathname}${location.search}${location.hash}`;
    // This is a UX redirect only; every /cms endpoint enforces auth server-side.
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
