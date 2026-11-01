import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { AuthProvider } from '@/features/auth';
import { RequireRole } from './RequireRole';

function renderGuard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<RequireRole allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<p>Área administrativa</p>} />
            </Route>
            <Route path="/login" element={<p>Tela de login</p>} />
            <Route path="/acesso-negado" element={<p>Acesso negado</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const sessionAs = (role: string) =>
  server.use(
    http.get('*/auth/me', () =>
      HttpResponse.json({ id: '9', name: 'Teste', email: 't@t.com', role }),
    ),
  );

describe('RequireRole', () => {
  it('redireciona para o login quando não há sessão', async () => {
    renderGuard();
    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
  });

  it('libera o perfil permitido', async () => {
    sessionAs('ADMIN');
    renderGuard();
    expect(await screen.findByText('Área administrativa')).toBeInTheDocument();
  });

  it('bloqueia perfil sem permissão', async () => {
    sessionAs( 'STUDENT');
    renderGuard();
    expect(await screen.findByText('Acesso negado')).toBeInTheDocument();
  });
});
