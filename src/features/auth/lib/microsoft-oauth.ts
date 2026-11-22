import { env } from '@/shared/config/env';

const OAUTH_STATE_KEY = 'challenge-x.microsoft-oauth-state';
const OAUTH_RETURN_TO_KEY = 'challenge-x.microsoft-oauth-return-to';

/** Verifica se o Entra ID está configurado no frontend para iniciar o fluxo OAuth2. */
export function isMicrosoftOAuthConfigured(): boolean {
  return Boolean(env.microsoftTenantId?.trim() && env.microsoftClientId?.trim());
}

/** URI de callback registrada no Entra ID e espelhada em MICROSOFT_REDIRECT_URI no backend. */
export function getMicrosoftRedirectUri(): string {
  const configured = env.microsoftRedirectUri?.trim();
  if (configured) return configured;
  return `${window.location.origin}/auth/microsoft/callback`;
}

function generateState(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Monta a URL de autorização do Microsoft Entra ID (Authorization Code Flow) e salva o `state`
 * em `sessionStorage` para validar o retorno em `/auth/microsoft/callback`.
 */
export function buildMicrosoftAuthorizeUrl(returnTo?: string): string {
  if (!isMicrosoftOAuthConfigured()) {
    throw new Error('Login com a Microsoft não configurado no frontend.');
  }

  const state = generateState();
  window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    window.sessionStorage.setItem(OAUTH_RETURN_TO_KEY, returnTo);
  } else {
    window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
  }

  const tenant = encodeURIComponent(env.microsoftTenantId.trim());
  const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
  url.searchParams.set('client_id', env.microsoftClientId.trim());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', getMicrosoftRedirectUri());
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', 'openid profile email');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

/** Valida e consome o `state` salvo na ida para evitar CSRF no callback OAuth. */
export function consumeMicrosoftOAuthState(receivedState: string | null): {
  valid: boolean;
  returnTo: string | null;
} {
  const expected = window.sessionStorage.getItem(OAUTH_STATE_KEY);
  const returnTo = window.sessionStorage.getItem(OAUTH_RETURN_TO_KEY);
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);

  return {
    valid: Boolean(expected && receivedState && expected === receivedState),
    returnTo: returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null,
  };
}

/** Há um login Microsoft em andamento nesta aba? */
export function hasPendingMicrosoftOAuthState(): boolean {
  return Boolean(window.sessionStorage.getItem(OAUTH_STATE_KEY));
}

/** Limpa o estado temporário de OAuth (ex.: quando o usuário cancela na Microsoft). */
export function clearMicrosoftOAuthState(): void {
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
}
