import { isAxiosError } from 'axios';
import { env } from '@/shared/config/env';
import { http } from '@/shared/lib/http';
import type { LoginInput, User } from '../types';

export async function login(input: LoginInput): Promise<User> {
  const { data } = await http.post<User>('/auth/login', input);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await http.get<User>('/auth/me');
    return data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}

/**
 * URL do fluxo Microsoft, conduzido pelo back-end (OAuth/OIDC). É uma navegação de página
 * inteira, não uma chamada XHR: o back-end valida a conta, abre a sessão (cookie) e
 * redireciona de volta ao front. Confirmar o caminho no openapi.yaml.
 */
export function getMicrosoftLoginUrl(returnTo?: string): string {
  const url = new URL('/auth/microsoft/login', env.apiUrl);
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  return url.toString();
}

/** SÓ MODO MOCK: abre a sessão simulada de um aluno/professor, como se viesse da Microsoft. */
export async function simulateMicrosoftLogin(email: string): Promise<User> {
  const { data } = await http.post<User>('/auth/microsoft/mock', { email });
  return data;
}

/** Mensagem de interface para falhas do login por senha (avaliador externo e admin). */
export function getLoginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.';
    const apiMessage = (error.response.data as { message?: unknown } | undefined)?.message;
    switch (error.response.status) {
      case 401:
        return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
      case 403:
        return typeof apiMessage === 'string' && apiMessage
          ? apiMessage
          : 'Sua conta não tem permissão para entrar por aqui.';
      case 429:
        return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    }
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
