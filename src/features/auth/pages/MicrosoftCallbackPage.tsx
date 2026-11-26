import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, ButtonLink, Spinner } from '@/shared/ui';
import { getLoginErrorMessage } from '../api/auth.api';
import { clearMicrosoftOAuthState, consumeMicrosoftOAuthState } from '../lib/microsoft-oauth';
import { homePathFor, needsProfile } from '../roles';
import type { User } from '../types';
import { useAuth } from '../useAuth';
import styles from './LoginPage.module.css';

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'O login com a Microsoft foi cancelado.',
  microsoft_denied: 'O login com a Microsoft foi cancelado.',
  temporarily_unavailable:
    'O serviço de autenticação da Microsoft está temporariamente indisponível.',
};

type CallbackOutcome = {
  user: User;
  returnTo: string | null;
};

// Evita trocar o mesmo authorization code duas vezes sob React StrictMode.
const inFlightCallbacks = new Map<string, Promise<CallbackOutcome>>();

function exchangeOnce(
  code: string,
  stateParam: string | null,
  exchange: (code: string) => Promise<User>,
): Promise<CallbackOutcome> {
  const key = `${code}|${stateParam ?? ''}`;
  const existing = inFlightCallbacks.get(key);
  if (existing) return existing;

  const task = (async () => {
    const { valid, returnTo } = consumeMicrosoftOAuthState(stateParam);
    if (!valid) {
      throw new Error('INVALID_STATE');
    }
    const user = await exchange(code);
    return { user, returnTo };
  })().finally(() => {
    inFlightCallbacks.delete(key);
  });

  inFlightCallbacks.set(key, task);
  return task;
}

/** Callback OAuth2/OIDC do Entra ID (/auth/microsoft/callback): troca `code` pela sessão em cookie. */
export function MicrosoftCallbackPage() {
  const { user, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const syncError = oauthError
    ? (CALLBACK_ERROR_MESSAGES[oauthError] ??
      oauthErrorDescription ??
      'Não foi possível autenticar com a Microsoft. Tente novamente.')
    : !code && !user
      ? 'Código de autorização da Microsoft ausente. Tente entrar novamente.'
      : null;

  useEffect(() => {
    if (oauthError) {
      clearMicrosoftOAuthState();
      return;
    }

    if (!code) {
      if (user) {
        navigate(homePathFor(user), { replace: true });
      } else {
        clearMicrosoftOAuthState();
      }
      return;
    }

    let cancelled = false;
    void exchangeOnce(code, state, loginWithMicrosoft)
      .then(({ user: loggedUser, returnTo }) => {
        if (cancelled) return;
        const destination = needsProfile(loggedUser)
          ? homePathFor(loggedUser)
          : (returnTo ?? homePathFor(loggedUser));
        navigate(destination, { replace: true });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof Error && err.message === 'INVALID_STATE') {
          setExchangeError('Sessão de autenticação expirada ou inválida. Tente entrar novamente.');
          return;
        }
        setExchangeError(getLoginErrorMessage(err, { microsoft: true }));
      });

    return () => {
      cancelled = true;
    };
  }, [code, loginWithMicrosoft, navigate, oauthError, state, user]);

  const error = syncError ?? exchangeError;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h1>Entrando com a Microsoft</h1>
        <p>Validando sua conta institucional na plataforma.</p>
      </div>

      {error ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <Alert tone="danger" title="Não foi possível concluir o login">
            {error}
          </Alert>
          <ButtonLink to="/login" size="large">
            Voltar para o login
          </ButtonLink>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
          <Spinner label="Concluindo autenticação com a Microsoft…" />
        </div>
      )}
    </section>
  );
}
