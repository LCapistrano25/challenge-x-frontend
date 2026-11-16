import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { buildStudentDashboard } from '@/mocks/fixtures/academic-home';
import { useState, type ReactNode } from 'react';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { FindTeamPage } from './FindTeamPage';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: '5', name: 'João Silva', email: 'j@x.com', role: 'STUDENT' } }),
}));

/** Faz o papel do cabeçalho do layout: mostra o título que a página definiu. */
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

/** Painel do aluno sem equipe (o fixture padrão já tem equipe). */
const withoutTeam = (overrides: Record<string, unknown> = {}) =>
  http.get('*/api/me/dashboard', () =>
    HttpResponse.json({ ...buildStudentDashboard(), team: null, ...overrides }),
  );

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/academico/equipe/buscar']}>
        <HeaderProbe>
          <Routes>
            <Route path="/academico/equipe/buscar" element={<FindTeamPage />} />
            <Route path="/academico/equipe" element={<p>Página da minha equipe</p>} />
          </Routes>
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const teamCard = async (name: string) => within(await screen.findByRole('listitem', { name }));

describe('FindTeamPage', () => {
  beforeEach(() => server.use(withoutTeam()));

  it('mostra orientação, formulários e equipes com vagas como no Figma', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Encontre sua equipe' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Você ainda está sem equipe · Formação até/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Restam 5 dias\./)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Criar uma equipe' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Já tem um código?' })).toBeInTheDocument();

    expect(await screen.findByText('3 equipes encontradas · Todas com vagas')).toBeInTheDocument();
    const raizes = await teamCard('Raízes do Futuro');
    expect(raizes.getByText('4 de 6 integrantes · 2 vagas')).toBeInTheDocument();
    expect(raizes.getByText('Marina Rocha')).toBeInTheDocument();
    expect(raizes.getByText('Liderança · Agronomia · Engenharia de Software')).toBeInTheDocument();
    expect(raizes.getByRole('button', { name: /Solicitar entrada/ })).toBeEnabled();

    // Solicitação pendente fica indicada.
    const ecolab = await teamCard('EcoLab');
    expect(await ecolab.findByRole('button', { name: /Solicitação enviada/ })).toBeInTheDocument();
    expect(ecolab.getByText(/Aguardando aprovação desde/)).toBeInTheDocument();
  });

  it('valida o formulário de criação', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Criar equipe' }));
    expect(await screen.findByText('Informe o nome da equipe.')).toBeInTheDocument();
    expect(screen.getByText('Selecione a área de interesse.')).toBeInTheDocument();
    expect(screen.getByText('Escreva a apresentação da equipe.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nome da equipe *'), 'AB');
    await user.click(screen.getByRole('button', { name: 'Criar equipe' }));
    expect(await screen.findByText(/entre 3 e 60 caracteres/)).toBeInTheDocument();
  });

  it('cria a equipe e leva para a página da equipe', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText('Nome da equipe *'), 'Nova Equipe');
    await user.selectOptions(screen.getByLabelText('Área de interesse *'), 'EDUCATION');
    await user.type(screen.getByLabelText('Apresentação da equipe *'), 'Queremos ensinar.');
    await user.click(screen.getByRole('button', { name: 'Criar equipe' }));

    expect(await screen.findByText('Página da minha equipe')).toBeInTheDocument();
  });

  it('mostra o erro de nome repetido no campo', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText('Nome da equipe *'), 'EcoLab');
    await user.selectOptions(screen.getByLabelText('Área de interesse *'), 'ENVIRONMENT');
    await user.type(screen.getByLabelText('Apresentação da equipe *'), 'Texto.');
    await user.click(screen.getByRole('button', { name: 'Criar equipe' }));

    expect(
      await screen.findByText('Já existe uma equipe com este nome nesta edição.'),
    ).toBeInTheDocument();
  });

  it('solicita entrada e permite cancelar a solicitação pendente', async () => {
    const user = userEvent.setup();
    renderPage();

    const raizes = await teamCard('Raízes do Futuro');
    await user.click(raizes.getByRole('button', { name: /Solicitar entrada/ }));
    const sent = await raizes.findByRole('button', { name: /Solicitação enviada/ });

    await user.click(sent);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar solicitação' }));

    expect(await raizes.findByRole('button', { name: /Solicitar entrada/ })).toBeInTheDocument();
  });

  it('verifica o código e mostra a equipe encontrada', async () => {
    const user = userEvent.setup();
    renderPage();

    const code = await screen.findByLabelText('Código de convite');
    await user.type(code, 'xx');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByText(/Código inválido/)).toBeInTheDocument();

    await user.clear(code);
    await user.type(code, 'dx27-cr22');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));
    const found = within(await screen.findByRole('status', { name: 'Equipe encontrada' }));
    expect(found.getByText('Cidade em Rede')).toBeInTheDocument();
    expect(found.getByRole('button', { name: /Solicitar entrada/ })).toBeEnabled();

    // Equipe lotada não aparece na lista de equipes com vagas.
    await user.clear(code);
    await user.type(code, 'DX27-MF24');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByText(/Nenhuma equipe com vagas encontrada/)).toBeInTheDocument();
  });

  it('bloqueia a entrada em equipe lotada', async () => {
    server.use(
      http.get('*/api/teams', () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 24,
              name: 'Mente em Foco',
              code: 'DX27-MF24',
              member_count: 6,
              available_slots: 0,
              courses: [],
            },
          ],
        }),
      ),
    );
    renderPage();

    const card = await teamCard('Mente em Foco');
    expect(card.getByRole('button', { name: 'Equipe completa' })).toBeDisabled();
  });

  it('bloqueia as ações quando o prazo de formação terminou', async () => {
    const past = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
    server.use(
      withoutTeam({
        stages: [
          {
            stage: {
              id: 2,
              position: 1,
              name: 'Formação das equipes',
              type: 'FORMATION',
              starts_at: past(20),
              ends_at: past(1),
              scored: false,
              points_value: null,
              phase_status: 'FINISHED',
            },
            deliverable_status: null,
            score: null,
          },
        ],
      }),
    );
    renderPage();

    expect(await screen.findByText(/O prazo de formação terminou/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar equipe' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Verificar código' })).toBeDisabled();
    const raizes = await teamCard('Raízes do Futuro');
    expect(raizes.getByRole('button', { name: /Solicitar entrada/ })).toBeDisabled();
  });

  it('orienta quem já participa de uma equipe', async () => {
    server.use(http.get('*/api/me/dashboard', () => HttpResponse.json(buildStudentDashboard())));
    renderPage();

    expect(
      await screen.findByText('Você já participa da equipe Equipe Aurora.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver minha equipe' })).toHaveAttribute(
      'href',
      '/academico/equipe',
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Criar equipe' })).toBeDisabled(),
    );
  });
});
