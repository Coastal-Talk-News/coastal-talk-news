import type { CmsUserDto } from '@coastal-talk-news/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../../api/auth.js';
import { ApiError, setUnauthorizedHandler } from '../../api/client.js';
import { queryKeys } from '../../api/queryKeys.js';

export type SignOutReason = 'expired' | 'manual';

export interface AuthContextValue {
  user: CmsUserDto | null;
  isLoading: boolean;
  isSigningOut: boolean;
  /** Set when the session ended on its own, so login can explain why. */
  signOutReason: SignOutReason | null;
  clearSignOutReason: () => void;
  setUser: (user: CmsUserDto) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutReason, setSignOutReason] = useState<SignOutReason | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => authApi.me(signal),
    // A 401 here means "not signed in" — retrying cannot change that.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 2,
    staleTime: 5 * 60 * 1000,
  });

  const user = data ?? null;

  // Read inside the 401 handler without making it depend on the user, which
  // would re-register the handler on every session change.
  const hasUser = useRef(false);
  hasUser.current = Boolean(user);

  /** Drops every cached query and marks the session ended, without triggering
   * a refetch of /me that would immediately 401 again. */
  const endSession = useCallback(
    (reason: SignOutReason) => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'session',
      });
      queryClient.setQueryData(queryKeys.session, null);
      setSignOutReason(reason);
    },
    [queryClient],
  );

  // One place decides what a 401 means: the cookie expired or was revoked
  // mid-session, so tear the session down and let RequireAuth redirect.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (hasUser.current) {
        endSession('expired');
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  const setUser = useCallback(
    (nextUser: CmsUserDto) => {
      queryClient.setQueryData(queryKeys.session, nextUser);
      setSignOutReason(null);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await authApi.logout();
    } finally {
      // Local state clears even if the request failed. Leaving someone
      // apparently signed in after they asked to leave is the worse outcome.
      endSession('manual');
      setIsSigningOut(false);
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSigningOut,
      signOutReason,
      clearSignOutReason: () => setSignOutReason(null),
      setUser,
      logout,
    }),
    [user, isLoading, isSigningOut, signOutReason, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
