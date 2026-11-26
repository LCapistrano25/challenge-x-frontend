import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { refreshCsrfToken, setUnauthorizedHandler } from '@/shared/lib/http';
import {
  fetchCurrentUser,
  login as loginRequest,
  loginWithMicrosoftCode,
  logout as logoutRequest,
} from './api/auth.api';
import { completeProfile as completeProfileRequest } from './api/profile.api';
import { AuthContext, type AuthContextValue } from './auth-context';
import type { User } from './types';

const ME_KEY = ['auth', 'me'] as const;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    void refreshCsrfToken();
    setUnauthorizedHandler(() => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const { data: user, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  });

  const { mutateAsync: loginAsync } = useMutation({
    mutationFn: loginRequest,
    onSuccess: (loggedUser) => queryClient.setQueryData(ME_KEY, loggedUser),
  });

  const { mutateAsync: microsoftLoginAsync } = useMutation({
    mutationFn: loginWithMicrosoftCode,
    onSuccess: (loggedUser) => queryClient.setQueryData(ME_KEY, loggedUser),
  });

  const { mutateAsync: logoutAsync } = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.setQueryData(ME_KEY, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
    },
  });

  const { mutateAsync: completeProfileAsync } = useMutation({
    mutationFn: (input: Parameters<AuthContextValue['completeProfile']>[0]) =>
      completeProfileRequest(input, queryClient.getQueryData<User | null>(ME_KEY)),
    onSuccess: (updatedUser) => queryClient.setQueryData(ME_KEY, updatedUser),
  });

  const login = useCallback<AuthContextValue['login']>((input) => loginAsync(input), [loginAsync]);
  const loginWithMicrosoft = useCallback<AuthContextValue['loginWithMicrosoft']>(
    (code) => microsoftLoginAsync(code),
    [microsoftLoginAsync],
  );
  const logout = useCallback(() => logoutAsync(), [logoutAsync]);

  useEffect(() => {
    if (!user) return;

    let idleTimer: number | undefined;

    const startIdleTimer = () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        void logoutAsync()
          .then(() => {
            window.location.replace('/');
          })
          .catch(() => undefined);
      }, IDLE_TIMEOUT_MS);
    };

    IDLE_EVENTS.forEach((eventName) => window.addEventListener(eventName, startIdleTimer, true));
    startIdleTimer();

    return () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      IDLE_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, startIdleTimer, true),
      );
    };
  }, [logoutAsync, user]);
  const refresh = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ME_KEY });
  }, [queryClient]);
  const completeProfile = useCallback<AuthContextValue['completeProfile']>(
    (input) => completeProfileAsync(input),
    [completeProfileAsync],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      login,
      loginWithMicrosoft,
      logout,
      refresh,
      completeProfile,
    }),
    [user, isLoading, login, loginWithMicrosoft, logout, refresh, completeProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
