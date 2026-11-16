import { createContext } from 'react';
import type { CompleteProfileInput, LoginInput, User } from './types';

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Busca de novo o usuário da sessão (ex.: depois do login simulado da Microsoft). */
  refresh: () => Promise<void>;
  /** Conclui o primeiro acesso e atualiza o usuário em memória. */
  completeProfile: (input: CompleteProfileInput) => Promise<User>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
