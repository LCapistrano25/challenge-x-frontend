import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mswHttp, HttpResponse } from 'msw';
import { useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { buildStudentDashboard } from '@/mocks/fixtures/academic-home';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { MyTeamPage } from './MyTeamPage';

const auth = vi.hoisted(() => ({ user: { id: '1', name: 'Ana Maria', role: 'STUDENT' } }));
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: auth.user }) }));

/** Faz o papel do cabeçalho do layout: mostra título e subtítulo definidos pela página. */
function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {content && <h1>{content.title}</h1>}
        {content?.subtitle && <p>{content.subtitle}</p>}
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}

/** Entra na sessão simulada com o login de cada cenário */
async function signIn(email: string, name: string) {
  auth.user = { id: 'x', name, role: 'STUDENT' };
  await http.post('/api/auth/sessions/password', { email, password: '123456' });
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/academico/equipe']}>
        <HeaderProbe>
          <Routes>
            <Route path="/academico/equipe" element={<MyTeamPage />} />
            <Route path="/academico/equipe/buscar" element={<p>Encontre sua equipe</p>} />
          </Routes>
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fact = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
const memberRow = (name: string) => within(screen.getByRole('listitem', { name }));

describe('MyTeamPage — líder', () => {
  beforeEach(() => {
    auth.user = { id: '1', name: 'Ana Maria', role: 'STUDENT' };
  });

  it('mostra a gestão da equipe como no Figma', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Minha equipe' }),
    ).toBeInTheDocument();
    // O subtítulo depende do papel, então só aparece depois que a equipe carrega.
    expect(
      await screen.findByText('Gerencie os integrantes, convites e informações da sua equipe.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Equipe Aurora' })).toBeInTheDocument();
    expect(screen.getByText('Você é líder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar informações' })).toBeInTheDocument();
    expect(fact('Integrantes')).toBe('4 de 6 estudantes');
    expect(fact('Vagas disponíveis')).toBe('2 vagas');
    await waitFor(() => expect(fact('Pendências')).toBe('2 convites · 1 solicitação'));

    expect(memberRow('Ana Maria').getByText('Ana Maria (você)')).toBeInTheDocument();
    expect(memberRow('Ana Maria').getByText('Responsável')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remover / })).toHaveLength(3);
    expect(screen.getByText('2 vagas disponíveis')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Pendências (3)' })).toBeInTheDocument();
    const luiza = memberRow('Luiza Costa');
    expect(luiza.getByText('Solicitação recebida')).toBeInTheDocument();
    expect(luiza.getByText(/Quero contribuir com pesquisa de campo/)).toBeInTheDocument();
    expect(memberRow('Marina Rocha').getByText(/Aguardando resposta/)).toBeInTheDocument();
    expect(screen.getByText('DXA7K2')).toBeInTheDocument();
  });

  it('aprova a solicitação e atualiza integrantes, vagas e pendências', async () => {
    const user = userEvent.setup();
    renderPage();

    const luiza = within(await screen.findByRole('listitem', { name: 'Luiza Costa' }));
    await user.click(luiza.getByRole('button', { name: 'Aprovar' }));

    await waitFor(() => expect(fact('Integrantes')).toBe('5 de 6 estudantes'));
    expect(fact('Vagas disponíveis')).toBe('1 vaga');
    expect(await screen.findByRole('heading', { name: 'Pendências (2)' })).toBeInTheDocument();
    expect(fact('Pendências')).toBe('2 convites');
  });

  it('remove integrante somente após confirmar', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Remover José Pereira' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Remover José Pereira?')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Remover' }));

    await waitFor(() => expect(fact('Integrantes')).toBe('3 de 6 estudantes'));
    expect(screen.queryByRole('listitem', { name: 'José Pereira' })).not.toBeInTheDocument();
  });

  it('envia convite por e-mail e cancela convite pendente', async () => {
    const user = userEvent.setup();
    renderPage();

    const send = await screen.findByRole('button', { name: 'Enviar convite' });
    await user.click(send);
    expect(
      await screen.findByText('Informe o e-mail institucional do estudante.'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('E-mail institucional'), 'nova@universidade.edu.br');
    await user.click(send);
    expect(
      await screen.findByRole('listitem', { name: 'nova@universidade.edu.br' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Pendências (4)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar convite para Pedro Alves' }));
    expect(await screen.findByRole('heading', { name: 'Pendências (3)' })).toBeInTheDocument();
  });

  it('não deixa o líder sair sem transferir a liderança', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Sair da equipe' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Transfira a liderança antes de sair')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Transferir liderança' }));

    const transfer = within(await screen.findByRole('dialog'));
    expect(transfer.getByRole('button', { name: 'Transferir' })).toBeDisabled();
    await user.selectOptions(
      transfer.getByLabelText('Novo líder'),
      'João Silva · Engenharia de Software',
    );
    await user.click(transfer.getByRole('button', { name: 'Transferir' }));

    // Após a transferência, a tela passa para a visão de participante.
    expect(await screen.findByText('Você é participante')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar informações' })).not.toBeInTheDocument();
    expect(fact('Liderança')).toBe('João Silva');
  });
});

describe('MyTeamPage — participante', () => {
  it('mostra os dados sem ações de gestão e permite sair após confirmar', async () => {
    const user = userEvent.setup();
    await signIn('participante@exemplo.com', 'João Silva');
    renderPage();

    expect(
      await screen.findByText('Consulte as informações e os integrantes da sua equipe.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Você é participante')).toBeInTheDocument();
    expect(fact('Liderança')).toBe('Ana Maria');
    expect(screen.getByText('4 integrantes')).toBeInTheDocument();
    expect(memberRow('João Silva').getByText('João Silva (você)')).toBeInTheDocument();
    expect(screen.getByText('Gestão exclusiva da liderança')).toBeInTheDocument();
    expect(screen.getByText('Equipe em formação')).toBeInTheDocument();

    // Cada ação só aparece para quem tem permissão.
    expect(screen.queryByRole('button', { name: 'Editar informações' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar convite' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Pendências/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sair da equipe' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Sair da equipe' }));
    expect(await screen.findByText('Encontre sua equipe')).toBeInTheDocument();
  });
});

describe('MyTeamPage — sem líder', () => {
  it('mostra o aviso e registra a solicitação de liderança com justificativa', async () => {
    const user = userEvent.setup();
    await signIn('sem-lider@exemplo.com', 'João Silva');
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Sua equipe está sem líder' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ana Maria saiu da equipe sem transferir a liderança/),
    ).toBeInTheDocument();
    expect(fact('Liderança')).toBe('Sem líder');
    expect(fact('Integrantes')).toBe('3 de 6 estudantes');
    expect(
      screen.getByText(
        'Enquanto a equipe estiver sem líder, a gestão de integrantes permanece indisponível.',
      ),
    ).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Solicitar liderança' }));
    const dialog = within(await screen.findByRole('dialog'));
    const submit = dialog.getByRole('button', { name: 'Enviar solicitação' });
    expect(submit).toBeDisabled();
    await user.type(dialog.getByLabelText('Justificativa *'), 'Quero conduzir as entregas.');
    await user.click(submit);

    expect(await screen.findByRole('button', { name: 'Solicitação enviada' })).toBeDisabled();
    expect(screen.getByText(/Aguardando a decisão de um professor/)).toBeInTheDocument();
  });
});

describe('MyTeamPage — mudancas-equipes', () => {
  it('exige confirmacao extra quando saida deixa equipe abaixo do minimo', async () => {
    const user = userEvent.setup({ delay: null });
    await signIn('participante@exemplo.com', 'João Silva');
    const seenConfirm: boolean[] = [];

    server.use(
      mswHttp.post('*/api/teams/:teamId/leave', async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
        seenConfirm.push(Boolean(body.confirm));
        if (!body.confirm) {
          return HttpResponse.json(
            {
              error: {
                code: 'leave_below_minimum',
                message: 'Sua saída deixa a equipe com 2 de 3 integrantes. Confirme para sair.',
                details: {},
              },
            },
            { status: 409 },
          );
        }
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Sair da equipe' }));
    const first = within(await screen.findByRole('dialog'));
    await user.click(first.getByRole('button', { name: 'Sair da equipe' }));

    const second = within(await screen.findByRole('dialog'));
    expect(second.getByText('Equipe abaixo do mínimo')).toBeInTheDocument();
    expect(second.getByText(/2 de 3 integrantes/)).toBeInTheDocument();
    await user.click(second.getByRole('button', { name: 'Confirmar saída' }));

    expect(await screen.findByText('Encontre sua equipe')).toBeInTheDocument();
    expect(seenConfirm).toEqual([false, true]);
  });

  it('exibe prazo extra, mantem convites liberados e bloqueia saida quando formation_extended_until esta no futuro', async () => {
    auth.user = { id: '1', name: 'Ana Maria', role: 'STUDENT' };
    const dashboard = buildStudentDashboard();
    const closedStages = dashboard.stages.map((item, index) =>
      index === 0 ? { ...item, stage: { ...item.stage, phase_status: 'CLOSED' as const } } : item,
    );
    const future = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
    const extendedTeam = { ...dashboard.team!, formation_extended_until: future };

    server.use(
      mswHttp.get('*/api/me/dashboard', () =>
        HttpResponse.json({ ...dashboard, team: extendedTeam, stages: closedStages }),
      ),
      mswHttp.get('*/api/teams/:teamId', () => HttpResponse.json(extendedTeam)),
    );

    renderPage();

    expect((await screen.findAllByText(/Prazo extra até/)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Enviar convite' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Sair da equipe' })).toBeDisabled();
  });
});
