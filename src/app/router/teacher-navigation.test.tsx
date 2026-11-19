import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, simulateMicrosoftLogin } from '@/features/auth';
import { routes } from './routes';

async function renderTeacher(path: string) {
  await simulateMicrosoftLogin('professor@exemplo.com');
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

const sidebar = () => screen.getByRole('complementary', { name: /Professor/ });

describe('navegação do professor', () => {
  it('a barra lateral tem Início, Projetos, Integrantes e Acervo', async () => {
    await renderTeacher('/professor');
    await screen.findByRole('heading', { name: 'Olá, Paulo!' });

    const links = within(sidebar()).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/professor', '/projetos', '/professor/integrantes', '/acervo']),
    );
  });

  it.each(['/projetos', '/acervo'])(
    '%s abre dentro do layout do professor, sem trocar a barra lateral',
    async (path) => {
      const router = await renderTeacher(path);

      expect(await screen.findByRole('complementary', { name: /Professor/ })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(path);
      expect(within(sidebar()).getByRole('link', { name: /Início/ })).toHaveAttribute(
        'href',
        '/professor',
      );
    },
  );
});
