import { useState, type SyntheticEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';
import { ROLE_HOME } from '../roles';
import { useAuth } from '../useAuth';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login({ email, password });
      navigate(from ?? ROLE_HOME[loggedUser.role], { replace: true });
    } catch {
      setError('E-mail ou senha incorretos. Confira os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Entrar</h1>
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
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </section>
  );
}
