import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { AdminDashboardPage } from './AdminDashboardPage';

function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <HeaderProbe>
            <AdminDashboardPage />
          </HeaderProbe>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AdminDashboardPage — painel administrativo (RF20)', () => {
  beforeEach(() =>
    http.post('/api/auth/sessions/password', { email: 'admin@exemplo.com', password: '123456' }),
  );

  it('mostra métricas, ações rápidas, cronograma e pendências', async () => {
    renderPage();

    // Métricas.
    expect(await screen.findByText('Total de projetos')).toBeInTheDocument();
    expect(screen.getByText('128 acadêmicos vinculados')).toBeInTheDocument();

    // Ações rápidas.
    expect(screen.getByRole('link', { name: 'Criar edição' })).toHaveAttribute(
      'href',
      '/admin/etapas',
    );
    expect(screen.getByRole('button', { name: 'Publicar edital' })).toBeDisabled();

    // Gestão da edição: progresso + cronograma + pontuação.
    const management = within(screen.getByRole('region', { name: 'Gestão da edição' }));
    expect(
      management.getByText('9 de 12 requisitos concluídos', { exact: false }),
    ).toBeInTheDocument();
    expect(management.getByText('Abertura das inscrições')).toBeInTheDocument();
    expect(management.getByText(/Pontuação válida: 10 de 10 pontos/)).toBeInTheDocument();

    // Pendências.
    const pend = within(screen.getByRole('region', { name: 'Pendências' }));
    expect(pend.getByText('Publicar o edital da edição 2027')).toBeInTheDocument();
  });
});
