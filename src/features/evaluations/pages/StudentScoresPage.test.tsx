import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { StudentScoresPage } from './StudentScoresPage';

function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {content && <h1>{content.title}</h1>}
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}

async function signIn(email: string) {
  await http.post('/api/auth/sessions/password', { email, password: '123456' });
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/academico/notas']}>
        <HeaderProbe>
          <StudentScoresPage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StudentScoresPage', () => {
  it('mostra a nota definitiva, as médias por critério e o parecer (RF32)', async () => {
    await signIn('integrante.projeto@exemplo.com');
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Notas' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'AgroConecta — da horta à comunidade' }),
    ).toBeInTheDocument();
    expect(screen.getByText('pontos em notas definitivas')).toBeInTheDocument();
    expect(screen.getByText('1 de 4')).toBeInTheDocument();

    const research = within(
      screen.getByRole('heading', { name: 'Pesquisa e diagnóstico' }).closest('li')!,
    );
    expect(research.getByText('Definitiva')).toBeInTheDocument();
    expect(research.getByText('1,70')).toBeInTheDocument();
    expect(research.getByRole('rowheader', { name: 'Clareza do problema' })).toBeInTheDocument();
    expect(research.getByText(/Ampliem a amostra/)).toBeInTheDocument();
  });

  it('nota parcial fica pendente e sem valor', async () => {
    await signIn('integrante.projeto@exemplo.com');
    renderPage();

    const proposal = within(
      (await screen.findByRole('heading', { name: 'Proposta de solução' })).closest('li')!,
    );
    expect(proposal.getByText('Pendente')).toBeInTheDocument();
    expect(proposal.getByText('Vale 2,50 pontos')).toBeInTheDocument();
    expect(proposal.getByText(/1 de 2 avaliações concluídas/)).toBeInTheDocument();
    expect(proposal.queryByRole('table')).not.toBeInTheDocument();
  });

  it('sem projeto cadastrado, orienta a ver o projeto', async () => {
    renderPage();

    expect(
      await screen.findByText('O projeto da equipe ainda não foi cadastrado'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver projeto' })).toHaveAttribute(
      'href',
      '/academico/projeto',
    );
  });
});
