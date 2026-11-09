import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, type ReactNode } from 'react';
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from './api/auth.api';
import { AuthContext, type AuthContextValue } from './auth-context';

const ME_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

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

  const { mutateAsync: logoutAsync } = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });

  const login = useCallback<AuthContextValue['login']>((input) => loginAsync(input), [loginAsync]);
  const logout = useCallback(() => logoutAsync(), [logoutAsync]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: user ?? null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
