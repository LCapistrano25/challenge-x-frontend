import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { routes } from './routes';

function renderEvaluator(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(['auth', 'me'], {
    id: '3',
    name: 'Ana Clara',
    email: 'avaliador@exemplo.com',
    role: 'EXTERNAL_EVALUATOR',
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('navegação do avaliador externo', () => {
  it('separa Projetos e Acervo das áreas da banca e mantém ícones próprios', async () => {
    renderEvaluator('/avaliador');

    const sidebar = await screen.findByRole(
      'complementary',
      { name: /Avaliador externo/ },
      { timeout: 5000 },
    );
    const sidebarNav = within(sidebar).getByRole('navigation');
    const projectsLink = within(sidebarNav).getByRole('link', { name: 'Projetos' });
    const archiveLink = within(sidebarNav).getByRole('link', { name: 'Acervo' });
    const finalistsLink = within(sidebarNav).getByRole('link', { name: 'Projetos finalistas' });
    const evaluationsLink = within(sidebarNav).getByRole('link', { name: 'Minhas avaliações' });

    expect(projectsLink).toHaveAttribute('href', '/projetos');
    expect(archiveLink).toHaveAttribute('href', '/acervo');
    expect(finalistsLink.querySelector('svg')?.innerHTML).not.toBe(
      projectsLink.querySelector('svg')?.innerHTML,
    );
    expect(evaluationsLink.querySelector('svg')?.innerHTML).not.toBe(
      archiveLink.querySelector('svg')?.innerHTML,
    );

    expect(
      screen.queryByRole('navigation', { name: 'Navegação da área Avaliador externo' }),
    ).not.toBeInTheDocument();

    const bottomNav = within(
      screen.getByRole('navigation', { name: 'Atalhos Avaliador externo' }),
    ).getAllByRole('link');
    expect(bottomNav.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/avaliador',
      '/avaliador/avaliacoes',
    ]);
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  }, 10000);

  it.each([
    ['/projetos', 'Vitrine de Projetos'],
    ['/acervo', 'Acervo Histórico'],
  ])('%s abre a tela pública existente dentro do layout do avaliador', async (path, heading) => {
    renderEvaluator(path);

    expect(
      await screen.findByRole('heading', { name: heading }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /Avaliador externo/ })).toBeInTheDocument();
  });
});
