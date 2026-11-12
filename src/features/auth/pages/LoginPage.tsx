import { useState, type SyntheticEvent } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { cn } from '@/shared/lib/cn';
import { redirectTo } from '@/shared/lib/redirect';
import { Button, Input } from '@/shared/ui';
import {
  getLoginErrorMessage,
  getMicrosoftLoginUrl,
  simulateMicrosoftLogin,
} from '../api/auth.api';
import { MicrosoftMockPicker } from '../components/MicrosoftMockPicker';
import { homePathFor, needsProfile } from '../roles';
import { useAuth } from '../useAuth';
import styles from './LoginPage.module.css';

type LoginMode = 'academic' | 'external';

type LoginPageProps = {
  adminOnly?: boolean;
};

/** Regra de negócio violada no login (ex.: aluno tentando entrar por senha). */
class LoginRuleError extends Error {}

/** Códigos que o back-end pode devolver em /login?error= após o retorno da Microsoft. */
const MICROSOFT_ERRORS: Record<string, string> = {
  microsoft_denied: 'O login com a Microsoft foi cancelado.',
  account_not_allowed: 'Esta conta Microsoft não tem acesso à plataforma.',
};

/** Seletor de contas simuladas: só em desenvolvimento com mocks ligados. */
const USE_MICROSOFT_MOCK = import.meta.env.DEV && env.enableMocks;

export function LoginPage({ adminOnly = false }: LoginPageProps) {
  const { user, login, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<LoginMode>(adminOnly ? 'external' : 'academic');
  const [email, setEmail] = useState(
    () => window.localStorage.getItem('challenge-x.remembered-email') ?? '',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => window.localStorage.getItem('challenge-x.remembered-email') !== null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMockPicker, setShowMockPicker] = useState(false);

  if (user) {
    return (
      <Navigate
        to={adminOnly && user.role !== 'ADMIN' ? '/acesso-negado' : homePathFor(user)}
        replace
      />
    );
  }

  const from = (location.state as { from?: string } | null)?.from;
  const callbackCode = searchParams.get('error');
  const callbackError = callbackCode
    ? (MICROSOFT_ERRORS[callbackCode] ??
      'Não foi possível entrar com a Microsoft. Tente novamente.')
    : null;

  function handleMicrosoft() {
    setError(null);
    if (USE_MICROSOFT_MOCK) {
      setShowMockPicker((visible) => !visible);
      return;
    }
    redirectTo(getMicrosoftLoginUrl(from));
  }

  async function handleMockPick(email: string) {
    setError(null);
    setSubmitting(true);
    try {
      await simulateMicrosoftLogin(email);
      await refresh(); // com a sessão aberta, o redirecionamento acontece no topo desta página
    } catch (err) {
      setError(getLoginErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login({ email, password });
      if (adminOnly && loggedUser.role !== 'ADMIN') {
        await logout();
        throw new LoginRuleError('Acesso administrativo não autorizado.');
      }
      if (!adminOnly && (loggedUser.role === 'STUDENT' || loggedUser.role === 'TEACHER')) {
        // Defesa extra: o back-end já deve recusar, mas o front não mantém essa sessão.
        await logout();
        throw new LoginRuleError('Alunos e professores entram com a conta Microsoft.');
      }
      if (rememberMe) {
        window.localStorage.setItem('challenge-x.remembered-email', email);
      } else {
        window.localStorage.removeItem('challenge-x.remembered-email');
      }
      // Primeiro acesso pendente tem prioridade sobre qualquer rota de origem.
      const destination = needsProfile(loggedUser)
        ? homePathFor(loggedUser)
        : (from ?? homePathFor(loggedUser));
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof LoginRuleError ? err.message : getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h1>{adminOnly ? 'Acesso administrativo' : 'Bem-vindo ao Desafio X'}</h1>
        <p>
          {adminOnly
            ? 'Entre com suas credenciais de administrador.'
            : 'Entre para continuar na plataforma.'}
        </p>
      </div>

      {!adminOnly && (
        <div className={styles.switcher} role="group" aria-label="Tipo de acesso">
          <button
            type="button"
            className={cn(styles.switcherOption, mode === 'academic' && styles.active)}
            aria-pressed={mode === 'academic'}
            onClick={() => {
              setMode('academic');
              setError(null);
            }}
          >
            Aluno ou professor
          </button>
          <button
            type="button"
            className={cn(styles.switcherOption, mode === 'external' && styles.active)}
            aria-pressed={mode === 'external'}
            onClick={() => {
              setMode('external');
              setError(null);
            }}
          >
            Avaliador externo
          </button>
        </div>
      )}

      {mode === 'academic' && !adminOnly ? (
        <div className={styles.academic}>
          <Button
            type="button"
            variant="secondary"
            size="large"
            fullWidth
            className={styles.microsoftButton}
            disabled={submitting}
            onClick={handleMicrosoft}
          >
            <MicrosoftIcon />
            Entrar com a Microsoft
          </Button>
          <p>Use sua conta institucional para acessar.</p>
          {USE_MICROSOFT_MOCK && showMockPicker && (
            <MicrosoftMockPicker onPick={handleMockPick} disabled={submitting} />
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <label>
            E-mail
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <span className={styles.passwordField}>
              <Input
                className={styles.passwordInput}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </span>
          </label>
          <label className={styles.rememberMe}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Lembrar de mim</span>
          </label>
          {error && <p role="alert">{error}</p>}
          <Button type="submit" size="large" fullWidth disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      )}
      {mode === 'academic' && (error ?? callbackError) && (
        <p role="alert">{error ?? callbackError}</p>
      )}
    </section>
  );
}

function MicrosoftIcon() {
  return (
    <span className={styles.microsoftIcon} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.8M6.3 6.8C3.9 8.3 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 2.4-.3" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
