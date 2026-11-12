import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/router/routes';
import { AuthProvider } from '@/features/auth';

// Simula VITE_ENABLE_MOCKS=true (o seletor de contas Microsoft só existe nesse modo).
vi.mock('@/shared/config/env', () => ({
  env: { apiUrl: 'http://localhost:8000', enableMocks: true },
}));

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

async function openPicker() {
  fireEvent.click(await screen.findByRole('button', { name: /Entrar com a Microsoft/ }));
}

describe('LoginPage em modo mock: login Microsoft simulado', () => {
  it('o botão abre o seletor com as quatro contas simuladas', async () => {
    renderLogin();

    await openPicker();

    const picker = screen.getByRole('group', { name: 'Simulação do login Microsoft' });
    expect(within(picker).getAllByRole('button')).toHaveLength(4);
  });

  it('aluno em primeiro acesso cai no cadastro obrigatório', async () => {
    const router = renderLogin();
    await openPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Aluno — primeiro acesso' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'));
    expect(await screen.findByRole('heading', { name: 'Preencher dados' })).toBeInTheDocument();
  });

  it('professor em primeiro acesso cai no cadastro com a seleção de cursos', async () => {
    const router = renderLogin();
    await openPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Professor — primeiro acesso' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro'));
    expect(await screen.findByRole('button', { name: /Cursos/ })).toBeInTheDocument();
  });

  it('aluno já cadastrado vai direto para a própria área, sem ver o cadastro', async () => {
    const router = renderLogin();
    await openPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Aluno — já cadastrado' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/academico'));
  });

  it('professor já cadastrado vai direto para a própria área', async () => {
    const router = renderLogin();
    await openPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Professor — já cadastrado' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/professor'));
  });
});
