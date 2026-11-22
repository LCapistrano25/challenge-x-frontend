import { isAxiosError } from 'axios';
import { getApiError } from '@/shared/lib/api-error';
import { http, refreshCsrfToken } from '@/shared/lib/http';
import { buildMicrosoftAuthorizeUrl } from '../lib/microsoft-oauth';
import type { LoginInput, User } from '../types';

/** Resposta do back-end (snake_case) ou do mock (já no formato do front). */
type SessionBody = Omit<User, 'id'> & {
  id?: string;
  user_id?: number;
  profile_completed?: boolean;
};

function toUser({ user_id, profile_completed, ...rest }: SessionBody): User {
  const user = { ...rest, id: String(rest.id ?? user_id) } as User;
  // O backend usa EXTERNAL_REVIEWER nos models e o frontend usa EXTERNAL_EVALUATOR nas rotas.
  if ((rest.role as string) === 'EXTERNAL_REVIEWER') user.role = 'EXTERNAL_EVALUATOR';
  if (profile_completed !== undefined) user.profileComplete = profile_completed;
  return user;
}

export async function login(input: LoginInput): Promise<User> {
  await refreshCsrfToken();
  const { data } = await http.post<SessionBody>('/api/auth/sessions/password', input);
  await refreshCsrfToken();
  return toUser(data);
}

/** Autentica aluno/professor trocando o `code` OAuth da Microsoft pela sessão em cookie. */
export async function loginWithMicrosoftCode(code: string): Promise<User> {
  await refreshCsrfToken();
  const { data } = await http.post<SessionBody>('/api/auth/sessions/microsoft', { code });
  await refreshCsrfToken();
  return toUser(data);
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await http.get<SessionBody>('/api/auth/me');
    return toUser(data);
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await http.post('/api/auth/logout');
}

/**
 * URL do fluxo OAuth2/OIDC da Microsoft (Entra ID), redirecionando de volta para
 * `/auth/microsoft/callback` onde o frontend troca o `code` via `POST /api/auth/sessions/microsoft`.
 */
export function getMicrosoftLoginUrl(returnTo?: string): string {
  return buildMicrosoftAuthorizeUrl(returnTo);
}

/** SÓ MODO MOCK: abre a sessão simulada de um aluno/professor, como se viesse da Microsoft. */
export async function simulateMicrosoftLogin(email: string): Promise<User> {
  const { data } = await http.post<User>('/auth/microsoft/mock', { email });
  return data;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
  invalid_email_domain: 'Este e-mail institucional não pertence a um domínio autorizado.',
  domain_role_mismatch: 'Este domínio de e-mail institucional não é permitido para o seu perfil.',
  inactive_account: 'Sua conta está inativa. Procure a administração.',
  microsoft_identity_mismatch: 'Esta conta Microsoft não corresponde ao vínculo cadastrado.',
  external_service_error:
    'Serviço de autenticação da Microsoft indisponível no momento. Tente novamente.',
};

/** Mensagem de interface para falhas do login (senha ou Microsoft). */
export function getLoginErrorMessage(
  error: unknown,
  options: { microsoft?: boolean } = {},
): string {
  const apiError = getApiError(error);
  if (apiError) {
    if (options.microsoft && apiError.code === 'invalid_credentials') {
      return 'Não foi possível validar sua conta Microsoft (código inválido, expirado ou de outra organização). Tente novamente.';
    }
    return AUTH_ERROR_MESSAGES[apiError.code] ?? apiError.message ?? 'Erro ao autenticar.';
  }
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
      case 503:
        return 'Serviço indisponível no momento. Tente novamente.';
    }
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
