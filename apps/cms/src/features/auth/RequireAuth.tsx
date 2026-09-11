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
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
