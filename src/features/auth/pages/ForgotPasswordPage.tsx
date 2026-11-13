import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/shared/ui';

type Step = 'email' | 'check-email' | 'reset' | 'success';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  const validPassword = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  function handleEmailSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }

    setStep('check-email');
  }

  function handlePasswordSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!validPassword) {
      setError('A senha não atende a todos os requisitos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setStep('success');
  }

  return (
    <section className="auth-card">
      {step === 'email' && (
        <>
          <h1>Esqueceu sua senha?</h1>
          <p>
            Informe seu e-mail cadastrado. Enviaremos as instruções para recuperação da sua senha.
          </p>

          <form onSubmit={handleEmailSubmit} noValidate>
            <label>
              E-mail
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                required
              />
            </label>

            {error && <p role="alert">{error}</p>}

            <Button type="submit">Enviar instruções</Button>
          </form>

          <p>
            <Link to="/login">Voltar para o login</Link>
          </p>
        </>
      )}

      {step === 'check-email' && (
        <>
          <h1>Verifique seu e-mail</h1>
          <p>
            Se existir uma conta associada ao endereço informado, você receberá instruções para
            redefinir sua senha.
          </p>
          <p>
            <strong>{email}</strong>
          </p>

          <Button type="button" onClick={() => setStep('reset')}>
            Continuar para redefinir senha
          </Button>

          <p>
            <Link to="/login">Voltar para o login</Link>
          </p>
        </>
      )}

      {step === 'reset' && (
        <>
          <h1>Redefina sua senha</h1>
          <p>Crie uma nova senha para sua conta.</p>

          <form onSubmit={handlePasswordSubmit} noValidate>
            <label>
              Nova senha
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <div>
              <strong>Requisitos da senha:</strong>
              <p>{hasMinLength ? '✓' : '○'} Pelo menos 8 caracteres</p>
              <p>{hasUppercase ? '✓' : '○'} Uma letra maiúscula</p>
              <p>{hasLowercase ? '✓' : '○'} Uma letra minúscula</p>
              <p>{hasNumber ? '✓' : '○'} Um número</p>
            </div>

            <label>
              Confirmar nova senha
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>

            {error && <p role="alert">{error}</p>}

            <Button type="submit">Redefinir senha</Button>
          </form>
        </>
      )}

      {step === 'success' && (
        <>
          <h1>Senha redefinida com sucesso!</h1>
          <p>Sua nova senha foi validada.</p>
          <Button type="button">
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
              Voltar para o login
            </Link>
          </Button>
        </>
      )}
    </section>
  );
}
