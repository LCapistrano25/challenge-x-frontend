import { useState, type SyntheticEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { ROLE_HOME } from '../roles';
import { useAuth } from '../useAuth';
import './LoginPage.css';

type LoginMode = 'academic' | 'external';

type LoginPageProps = {
  adminOnly?: boolean;
};

export function LoginPage({ adminOnly = false }: LoginPageProps) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  if (user) {
    return (
      <Navigate
        to={adminOnly && user.role !== 'ADMIN' ? '/acesso-negado' : ROLE_HOME[user.role]}
        replace
      />
    );
  }

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login({ email, password });
      if (adminOnly && loggedUser.role !== 'ADMIN') {
        await logout();
        throw new Error('Acesso administrativo não autorizado.');
      }
      if (rememberMe) {
        window.localStorage.setItem('challenge-x.remembered-email', email);
      } else {
        window.localStorage.removeItem('challenge-x.remembered-email');
      }
      navigate(from ?? ROLE_HOME[loggedUser.role], { replace: true });
    } catch {
      setError('E-mail ou senha incorretos. Confira os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <header className="login-page__header">
        <strong>Desafio X</strong>
        <a href="mailto:suporte@desafiox.com">Precisa de ajuda?</a>
      </header>

      <main className="login-page__content">
        <section className={`auth-card login-card${adminOnly ? ' login-card--admin' : ''}`}>
          <div className="login-card__header">
            <h1>{adminOnly ? 'Acesso administrativo' : 'Bem-vindo ao Desafio X'}</h1>
            <p>
              {adminOnly
                ? 'Entre com suas credenciais de administrador.'
                : 'Entre para continuar na plataforma.'}
            </p>
          </div>

          {!adminOnly && (
            <div className="login-switcher" role="group" aria-label="Tipo de acesso">
              <button
                type="button"
                className={
                  mode === 'academic'
                    ? 'login-switcher__option is-active'
                    : 'login-switcher__option'
                }
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
                className={
                  mode === 'external'
                    ? 'login-switcher__option is-active'
                    : 'login-switcher__option'
                }
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
            <div className="login-card__academic">
              <Button
                type="button"
                variant="secondary"
                size="large"
                className="microsoft-button"
                onClick={() => setError('O login com a Microsoft ainda não está configurado.')}
              >
                <MicrosoftIcon />
                Entrar com a Microsoft
              </Button>
              <p>Use sua conta institucional para acessar.</p>
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
                <span className="password-field">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-field__toggle"
                    aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Lembrar de mim</span>
              </label>
              {error && <p role="alert">{error}</p>}
              <Button type="submit" size="large" disabled={submitting}>
                {submitting ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          )}
          {mode === 'academic' && error && <p role="alert">{error}</p>}
        </section>
      </main>
      <footer className="login-page__footer">
        © 2026 Desafio X. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <span className="microsoft-icon" aria-hidden="true">
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
