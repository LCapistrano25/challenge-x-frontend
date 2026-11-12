import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { routes } from './routes';

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('rotas e layouts', () => {
  it.each(['/login', '/admin/login', '/recuperar-senha'])(
    '%s usa o AuthLayout, sem sidebar',
    async (path) => {
      renderAt(path);

      expect(await screen.findByRole('link', { name: 'Desafio X' })).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    },
  );

  it('a tela de login aparece uma única vez (sem moldura duplicada)', async () => {
    renderAt('/login');

    expect(
      await screen.findByRole('heading', { name: 'Bem-vindo ao Desafio X' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('o acesso administrativo mostra o título correto', async () => {
    renderAt('/admin/login');

    expect(
      await screen.findByRole('heading', { name: 'Acesso administrativo' }),
    ).toBeInTheDocument();
  });

  it('páginas públicas mantêm a sidebar', async () => {
    renderAt('/acesso-negado');

    expect(await screen.findByRole('heading', { name: 'Acesso negado' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /Navegação/ })).toBeInTheDocument();
  });

  it('endereço inexistente cai na página 404 dentro do layout público', async () => {
    renderAt('/nao-existe');

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});
