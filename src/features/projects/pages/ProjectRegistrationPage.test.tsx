import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw';
import { useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { buildStudentDashboard } from '@/mocks/fixtures/academic-home';
import { server } from '@/mocks/server';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { ProjectRegistrationPage } from './ProjectRegistrationPage';

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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/academico/projeto/novo']}>
        <HeaderProbe>
          <Routes>
            <Route path="/academico/projeto/novo" element={<ProjectRegistrationPage />} />
            <Route path="/academico/projeto" element={<p>Tela do projeto</p>} />
          </Routes>
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const signIn = (email: string) =>
  http.post('/api/auth/sessions/password', { email, password: '123456' });

async function findForm() {
  return within(await screen.findByRole('region', { name: 'Dados do projeto' }));
}

/** Preenche os campos seguindo a ordem do contrato (desafio -> dados -> categoria). */
async function fillRequired(user: ReturnType<typeof userEvent.setup>, title = 'AgroConecta') {
  await user.selectOptions(
    screen.getByLabelText('Objetivo de Desenvolvimento Sustentável *'),
    'ODS 11 · Cidades sustentáveis',
  );
  await user.type(screen.getByLabelText('Título do projeto *'), title);
  await user.type(screen.getByLabelText('Resumo da proposta *'), 'Plataforma para produtores.');
  await user.type(screen.getByLabelText('Objetivo geral'), 'Ampliar o comércio local.');
  await user.selectOptions(
    screen.getByLabelText('Eixo temático *'),
    'Tecnologia e sustentabilidade',
  );
  await user.click(screen.getByRole('checkbox', { name: /Declaro que os integrantes/ }));
}

describe('ProjectRegistrationPage — líder', () => {
  it('mostra o formulário em ordem e desabilita dados/categoria antes do desafio', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cadastrar projeto' }),
    ).toBeInTheDocument();
    const form = await findForm();
    expect(screen.getByText('O projeto da equipe ainda não foi cadastrado')).toBeInTheDocument();

    expect(form.getByLabelText('Objetivo de Desenvolvimento Sustentável *')).toBeEnabled();
    expect(form.getByLabelText('Título do projeto *')).toBeDisabled();
    expect(form.getByLabelText('Resumo da proposta *')).toBeDisabled();
    expect(form.getByLabelText('Eixo temático *')).toBeDisabled();
    expect(form.getByRole('button', { name: 'Salvar rascunho' })).toBeEnabled();
    expect(form.getByRole('button', { name: 'Cadastrar projeto' })).toBeEnabled();

    const team = within(screen.getByRole('region', { name: 'Equipe responsável' }));
    expect(team.getByText('Equipe Aurora')).toBeInTheDocument();
    expect(team.getByText('Não cadastrado')).toBeInTheDocument();
  });

  it('habilita dados após escolher desafio e conta caracteres do título e do resumo', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await findForm();

    await user.selectOptions(
      screen.getByLabelText('Objetivo de Desenvolvimento Sustentável *'),
      'ODS 11 · Cidades sustentáveis',
    );
    expect(screen.getByLabelText('Título do projeto *')).toBeEnabled();
    expect(screen.getByLabelText('Eixo temático *')).toBeEnabled();

    expect(screen.getByText('0/200')).toBeInTheDocument();
    expect(screen.getAllByText('0/1000')).toHaveLength(4);
    await user.type(screen.getByLabelText('Título do projeto *'), 'Agro');
    await user.type(screen.getByLabelText('Resumo da proposta *'), 'Resumo');
    expect(screen.getByText('4/200')).toBeInTheDocument();
    expect(screen.getByText('6/1000')).toBeInTheDocument();
  });

  it('valida os obrigatórios antes de cadastrar', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    const form = await findForm();

    await user.click(form.getByRole('button', { name: 'Cadastrar projeto' }));

    expect(
      await form.findByText('Selecione o Objetivo de Desenvolvimento Sustentável.'),
    ).toBeInTheDocument();
    expect(form.getByText('Informe o título do projeto.')).toBeInTheDocument();
    expect(form.getByText('Escreva o resumo da proposta.')).toBeInTheDocument();
    expect(form.getByText('Selecione o eixo temático.')).toBeInTheDocument();
    expect(form.getByText('Confirme a declaração para cadastrar o projeto.')).toBeInTheDocument();
    expect(form.getByLabelText('Objetivo de Desenvolvimento Sustentável *')).toHaveFocus();
    expect(screen.queryByText('Tela do projeto')).not.toBeInTheDocument();
  });

  it('salvar rascunho não conclui a inscrição e o rascunho volta ao reabrir', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    const form = await findForm();

    await user.selectOptions(
      form.getByLabelText('Objetivo de Desenvolvimento Sustentável *'),
      'ODS 11 · Cidades sustentáveis',
    );
    await user.type(form.getByLabelText('Título do projeto *'), 'Ideia inicial');
    await user.click(form.getByRole('button', { name: 'Salvar rascunho' }));

    expect(
      await form.findByText(/^Rascunho salvo às \d{2}:\d{2} · Ainda não cadastrado$/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Tela do projeto')).not.toBeInTheDocument();

    // Reabrindo a tela com projeto ainda incompleto, continua no cadastro e com rascunho.
    cleanup();
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cadastrar projeto' }),
    ).toBeInTheDocument();
  });

  it('cadastra o projeto em 3 passos e leva a equipe para a tela do Projeto', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await findForm();

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Cadastrar projeto' }));

    expect(await screen.findByText('Tela do projeto')).toBeInTheDocument();
    const { data } = await http.get('/api/teams/12/project');
    expect(data).toMatchObject({
      title: 'AgroConecta',
      challenge: { id: 17, sdg: { number: 11 } },
      category: { id: 1, name: 'Tecnologia e sustentabilidade' },
      objective: 'Ampliar o comércio local.',
    });
  });

  it('mostra no campo o título já usado na edição', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    await findForm();

    await fillRequired(user, 'Monitoramento inteligente do consumo de água');
    await user.click(screen.getByRole('button', { name: 'Cadastrar projeto' }));

    expect(
      await screen.findByText('Já existe um projeto com este título nesta edição.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Título do projeto *')).toHaveAttribute('aria-invalid', 'true');
  });

  it('bloqueia o cadastro depois do prazo da formação', async () => {
    server.use(
      mockHttp.get('*/api/me/dashboard', () => {
        const dashboard = buildStudentDashboard();
        return HttpResponse.json({
          ...dashboard,
          stages: dashboard.stages.map((item) =>
            item.stage.type === 'FORMATION'
              ? { ...item, stage: { ...item.stage, phase_status: 'FINISHED' } }
              : item,
          ),
        });
      }),
    );
    renderPage();
    const form = await findForm();

    expect(screen.getByText('O prazo de cadastro do projeto terminou')).toBeInTheDocument();
    expect(form.getByLabelText('Título do projeto *')).toBeDisabled();
    expect(form.getByRole('button', { name: 'Cadastrar projeto' })).toBeDisabled();
    expect(form.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
  });

  it('com o projeto já completo, vai direto para a tela do Projeto', async () => {
    await http.put('/api/teams/12/project/challenge', { challenge_id: 17 });
    await http.put('/api/teams/12/project/details', {
      title: 'AgroConecta',
      summary: 'Resumo',
      objective: 'Objetivo',
    });
    await http.put('/api/teams/12/project/category', { category_id: 1 });
    renderPage();
    expect(await screen.findByText('Tela do projeto')).toBeInTheDocument();
  });
});

describe('ProjectRegistrationPage — demais perfis', () => {
  it('participante vê acesso restrito, sem formulário', async () => {
    await signIn('participante@exemplo.com');
    renderPage();

    expect(await screen.findByText('Acesso restrito à liderança da equipe')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Dados do projeto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar projeto' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver minha equipe' })).toHaveAttribute(
      'href',
      '/academico/equipe',
    );
  });

  it('a API recusa o cadastro de quem não é líder', async () => {
    await signIn('participante@exemplo.com');
    await expect(
      http.put('/api/teams/12/project/challenge', { challenge_id: 17 }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it('aluno sem equipe é levado a encontrar uma equipe', async () => {
    await signIn('sem-equipe@exemplo.com');
    renderPage();

    expect(await screen.findByText('Você ainda não participa de uma equipe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Encontrar equipe' })).toBeInTheDocument();
  });
});
