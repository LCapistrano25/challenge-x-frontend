import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/mocks/server';
import { buildStudentDashboard } from '@/mocks/fixtures/academic-home';
import { PageHeaderProvider } from '../layouts/PageHeaderProvider';
import { usePageHeaderContent } from '../layouts/page-header-context';
import { AcademicHomePage } from './AcademicHomePage';

/** Mostra o título que a página envia ao cabeçalho do layout. */
function HeaderProbe() {
  const content = usePageHeaderContent();
  return content ? <h1>{content.title}</h1> : null;
}

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: '1', name: 'João Silva', email: 'j@x.com', role: 'STUDENT' } }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PageHeaderProvider>
          <HeaderProbe />
          <AcademicHomePage />
        </PageHeaderProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

const projectsFail = () =>
  http.get('*/api/public/projects', () =>
    HttpResponse.json(
      { error: { code: 'server_error', message: 'Erro', details: null } },
      { status: 500 },
    ),
  );

describe('AcademicHomePage', () => {
  it('monta a home com os dados da API', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Olá, João!' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Edição 2026')).toBeInTheDocument();

    const cards = await screen.findByRole('list', { name: 'Situação da formação da equipe' });
    expect(within(cards).getByText('5 dias')).toBeInTheDocument();
    expect(within(cards).getByText('3')).toBeInTheDocument();
    expect(within(cards).getByText('Vagas')).toBeInTheDocument();
    expect(within(cards).getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Líder')).toBeInTheDocument();
    expect(await screen.findByText('Marina Rocha')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Ver projeto Mente Saudável' })).toHaveAttribute(
      'href',
      '/projetos/41',
    );
    expect(screen.getByRole('list', { name: 'Cronograma da edição' })).toBeInTheDocument();
  });

  it('mostra os 4 projetos mais recentes', async () => {
    renderPage();
    const carousel = await screen.findByRole('list', { name: 'Projetos da edição' });
    expect(within(carousel).getAllByRole('listitem')).toHaveLength(4);
  });

  it('orienta quem ainda não tem equipe', async () => {
    server.use(
      http.get('*/api/me/dashboard', () =>
        HttpResponse.json({ ...buildStudentDashboard(), team: null, pending_actions: [] }),
      ),
    );
    renderPage();

    expect(await screen.findByText('Você ainda não participa de uma equipe.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Encontrar equipe' })).toHaveAttribute(
      'href',
      '/academico/equipe/buscar',
    );
  });

  it('avisa requisitos pendentes da formação (RF51)', async () => {
    server.use(
      http.get('*/api/me/dashboard', () =>
        HttpResponse.json({
          ...buildStudentDashboard(),
          incomplete_requirements: ['MIN_MEMBERS'],
        }),
      ),
    );
    renderPage();

    expect(await screen.findByText('Sua equipe ainda está incompleta.')).toBeInTheDocument();
  });

  it('isola o erro de uma seção sem derrubar a página', async () => {
    server.use(projectsFail());
    renderPage();

    expect(await screen.findByText('Não foi possível carregar os projetos.')).toBeInTheDocument();
    expect(await screen.findByText('Situação da equipe')).toBeInTheDocument();
  });

  it('tenta de novo pelo botão do alerta', async () => {
    server.use(projectsFail());
    renderPage();

    await screen.findByText('Não foi possível carregar os projetos.');
    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('list', { name: 'Projetos da edição' })).toBeInTheDocument();
  });

  it('mantém os dados em tela quando uma nova busca falha', async () => {
    const queryClient = renderPage();
    await screen.findByRole('list', { name: 'Projetos da edição' });

    server.use(projectsFail());
    await act(() => queryClient.refetchQueries());

    expect(screen.getByRole('list', { name: 'Projetos da edição' })).toBeInTheDocument();
    expect(screen.queryByText('Não foi possível carregar os projetos.')).not.toBeInTheDocument();
  });
});
