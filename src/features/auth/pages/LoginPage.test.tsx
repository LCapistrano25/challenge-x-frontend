import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/router/routes';
import { server } from '@/mocks/server';
import { redirectTo } from '@/shared/lib/redirect';
import { AuthProvider } from '@/features/auth';
import { fetchCurrentUser } from '../api/auth.api';

vi.mock('@/shared/lib/redirect', () => ({ redirectTo: vi.fn() }));

function renderLogin(path = '/login') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

async function submitPasswordLogin(email: string, password = '123456') {
  fireEvent.click(await screen.findByRole('button', { name: 'Avaliador externo' }));
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginPage: aluno e professor só entram pela Microsoft', () => {
  it('a aba padrão oferece o login Microsoft, sem formulário de senha', async () => {
    renderLogin();

    expect(
      await screen.findByRole('button', { name: /Entrar com a Microsoft/ }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
  });

  it('o botão leva ao fluxo Microsoft do back-end', async () => {
    renderLogin();

    fireEvent.click(await screen.findByRole('button', { name: /Entrar com a Microsoft/ }));

    expect(redirectTo).toHaveBeenCalledWith(expect.stringContaining('/auth/microsoft/login'));
  });

  it('mostra o motivo quando o back-end volta com ?error=', async () => {
    renderLogin('/login?error=microsoft_denied');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O login com a Microsoft foi cancelado.',
    );
  });

  it('usa uma mensagem genérica para códigos de erro desconhecidos', async () => {
    renderLogin('/login?error=algo_novo');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar com a Microsoft',
    );
  });

  it.each(['academico@exemplo.com', 'professor@exemplo.com'])(
    'recusa %s no login por senha',
    async (email) => {
      const router = renderLogin();

      await submitPasswordLogin(email);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Alunos e professores entram com a conta Microsoft.',
      );
      expect(router.state.location.pathname).toBe('/login');
      expect(await fetchCurrentUser()).toBeNull();
    },
  );

  it('derruba a sessão se o back-end deixar aluno entrar por senha (defesa do front)', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ id: '1', name: 'Ana', email: 'a@a.com', role: 'STUDENT' }),
      ),
      http.post('*/auth/logout', () => new HttpResponse(null, { status: 204 })),
    );
    const router = renderLogin();

    await submitPasswordLogin('a@a.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Alunos e professores entram com a conta Microsoft.',
    );
    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('LoginPage: avaliador externo', () => {
  it('entra por e-mail e senha e vai para a própria área', async () => {
    const router = renderLogin();

    await submitPasswordLogin('avaliador@exemplo.com');

    await waitFor(() => expect(router.state.location.pathname).toBe('/avaliador'));
  });

  it('mostra erro para senha incorreta', async () => {
    renderLogin();

    await submitPasswordLogin('avaliador@exemplo.com', 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });
});

describe('LoginPage: administrador', () => {
  it('admin entra pelo /admin/login', async () => {
    const router = renderLogin('/admin/login');

    fireEvent.change(await screen.findByLabelText('E-mail'), {
      target: { value: 'admin@exemplo.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
  });

  it('avaliador não entra pelo /admin/login', async () => {
    renderLogin('/admin/login');

    fireEvent.change(await screen.findByLabelText('E-mail'), {
      target: { value: 'avaliador@exemplo.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Acesso administrativo não autorizado.',
    );
  });
});
