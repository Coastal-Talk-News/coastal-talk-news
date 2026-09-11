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
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 2,
    staleTime: 5 * 60 * 1000,
  });

  const user = data ?? null;

  const hasUser = useRef(false);
  hasUser.current = Boolean(user);

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
