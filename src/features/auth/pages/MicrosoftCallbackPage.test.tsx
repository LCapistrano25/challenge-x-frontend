import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/router/routes';
import { AuthProvider } from '@/features/auth';
import { server } from '@/mocks/server';

function renderCallback(url: string, { strict = false } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const app = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
  render(strict ? <StrictMode>{app}</StrictMode> : app);
  return router;
}

describe('MicrosoftCallbackPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('encaminha retorno OAuth na raiz (/?code=...&state=...) para o callback e autentica', async () => {
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-state', 'st-root');

    const router = renderCallback('/?code=valid-student&state=st-root');

    await waitFor(() => expect(router.state.location.pathname).toBe('/academico'));
  });

  it('troca code valido e redireciona aluno completo para /academico (ou returnTo)', async () => {
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-state', 'st-1');
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-return-to', '/academico/equipe');

    const router = renderCallback('/auth/microsoft/callback?code=valid-student&state=st-1');

    await waitFor(() => expect(router.state.location.pathname).toBe('/academico/equipe'), {
      timeout: 5000,
    });
  });

  it('leva aluno em primeiro acesso (profile_completed=false) para /cadastro', async () => {
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-state', 'st-2');

    const router = renderCallback('/auth/microsoft/callback?code=new-student&state=st-2');

    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'));
    expect(await screen.findByRole('heading', { name: 'Preencher dados' })).toBeInTheDocument();
  });

  it('envia o code apenas uma vez mesmo em React StrictMode', async () => {
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-state', 'st-strict');
    let calls = 0;
    server.use(
      http.post('*/api/auth/sessions/microsoft', () => {
        calls += 1;
        return HttpResponse.json({
          user_id: 1,
          name: 'Ana',
          email: 'ana@a.catolica-to.edu.br',
          role: 'STUDENT',
          profile_completed: true,
        });
      }),
    );

    const router = renderCallback('/auth/microsoft/callback?code=strict-code&state=st-strict', {
      strict: true,
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/academico'));
    expect(calls).toBe(1);
  });

  it('recusa callback quando o state nao confere', async () => {
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-state', 'esperado');

    renderCallback('/auth/microsoft/callback?code=valid-student&state=outro');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sessão de autenticação expirada ou inválida',
    );
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('exibe cancelamento quando Microsoft retorna error=access_denied', async () => {
    renderCallback('/auth/microsoft/callback?error=access_denied');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O login com a Microsoft foi cancelado.',
    );
  });

  it('exibe erro amigavel quando backend rejeita o dominio (403 domain_role_mismatch)', async () => {
    window.sessionStorage.setItem('challenge-x.microsoft-oauth-state', 'st-err');

    renderCallback('/auth/microsoft/callback?code=domain-error&state=st-err');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'domínio de e-mail institucional não é permitido',
    );
  });
});
