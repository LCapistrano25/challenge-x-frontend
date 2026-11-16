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

const signIn = (email: string) => http.post('/auth/login', { email, password: '123456' });

async function findForm() {
  return within(await screen.findByRole('region', { name: 'Dados do projeto' }));
}

/** Preenche todos os obrigatórios e a declaração. */
async function fillRequired(user: ReturnType<typeof userEvent.setup>, title = 'AgroConecta') {
  await user.type(screen.getByLabelText('Título do projeto *'), title);
  await user.selectOptions(
    screen.getByLabelText('Eixo temático *'),
    'Tecnologia e sustentabilidade',
  );
  await user.selectOptions(
    screen.getByLabelText('Objetivo de Desenvolvimento Sustentável *'),
    'ODS 11 · Cidades sustentáveis',
  );
  await user.type(screen.getByLabelText('Resumo da proposta *'), 'Plataforma para produtores.');
  await user.type(screen.getByLabelText('Problema identificado *'), 'Poucos canais digitais.');
  await user.type(screen.getByLabelText('Objetivo geral *'), 'Ampliar o comércio local.');
  await user.type(
    screen.getByLabelText('Metodologia e plano de desenvolvimento *'),
    'Entrevistas e piloto.',
  );
  await user.type(screen.getByLabelText('Público beneficiado *'), 'Agricultores familiares');
  await user.type(screen.getByLabelText('Local de aplicação *'), 'Campus sede');
  await user.click(screen.getByRole('checkbox', { name: /Declaro que os integrantes/ }));
}

describe('ProjectRegistrationPage — líder', () => {
  it('mostra o formulário e o painel lateral como no Figma', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cadastrar projeto' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Apresente a proposta da equipe e dê o próximo passo no Desafio X.'),
    ).toBeInTheDocument();
    const form = await findForm();
    expect(screen.getByText('O projeto da equipe ainda não foi cadastrado')).toBeInTheDocument();
    for (const label of [
      'Título do projeto *',
      'Eixo temático *',
      'Objetivo de Desenvolvimento Sustentável *',
      'Resumo da proposta *',
      'Problema identificado *',
      'Objetivo geral *',
      'Metodologia e plano de desenvolvimento *',
      'Público beneficiado *',
      'Local de aplicação *',
      'Docente orientadora (opcional)',
      'E-mail da orientadora',
      'Link de referência (opcional)',
    ]) {
      expect(form.getByLabelText(label)).toBeInTheDocument();
    }
    expect(form.getByRole('button', { name: 'Salvar rascunho' })).toBeEnabled();
    expect(form.getByRole('button', { name: 'Cadastrar projeto' })).toBeEnabled();
    expect(form.getByText('Preenchimento em andamento · Ainda não cadastrado')).toBeInTheDocument();

    const team = within(screen.getByRole('region', { name: 'Equipe responsável' }));
    expect(team.getByText('Equipe Aurora')).toBeInTheDocument();
    expect(team.getByText('Não cadastrado')).toBeInTheDocument();
    expect(team.getByText('Líder · Responsável pelo cadastro')).toBeInTheDocument();
    expect(
      team.getByText('4 integrantes · Engenharia de Software e Agronomia'),
    ).toBeInTheDocument();
    expect(team.getByRole('link', { name: 'Ver minha equipe' })).toHaveAttribute(
      'href',
      '/academico/equipe',
    );
    expect(screen.getByText(/^Prazo de cadastro: \d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir guia do projeto' })).toBeInTheDocument();
  });

  it('conta os caracteres do título e do resumo', async () => {
    const user = userEvent.setup();
    renderPage();
    await findForm();

    expect(screen.getByText('0/100')).toBeInTheDocument();
    // Resumo, problema, objetivo e metodologia: até 1.000 caracteres cada.
    expect(screen.getAllByText('0/1000')).toHaveLength(4);
    await user.type(screen.getByLabelText('Título do projeto *'), 'Agro');
    await user.type(screen.getByLabelText('Resumo da proposta *'), 'Resumo');
    expect(screen.getByText('4/100')).toBeInTheDocument();
    expect(screen.getByText('6/1000')).toBeInTheDocument();
    // O campo não aceita mais que o limite.
    await user.type(screen.getByLabelText('Título do projeto *'), 'x'.repeat(120));
    expect(screen.getByLabelText('Título do projeto *')).toHaveValue(`Agro${'x'.repeat(96)}`);
    expect(screen.getByText('100/100')).toBeInTheDocument();
  });

  it('valida os obrigatórios antes de cadastrar', async () => {
    const user = userEvent.setup();
    renderPage();
    const form = await findForm();

    await user.click(form.getByRole('button', { name: 'Cadastrar projeto' }));

    expect(await form.findByText('Informe o título do projeto.')).toBeInTheDocument();
    expect(form.getByText('Selecione o eixo temático.')).toBeInTheDocument();
    expect(
      form.getByText('Selecione o Objetivo de Desenvolvimento Sustentável.'),
    ).toBeInTheDocument();
    expect(form.getByText('Escreva o resumo da proposta.')).toBeInTheDocument();
    expect(form.getByText('Informe o local de aplicação.')).toBeInTheDocument();
    expect(form.getByText('Confirme a declaração para cadastrar o projeto.')).toBeInTheDocument();
    expect(form.getByLabelText('Título do projeto *')).toHaveFocus();
    expect(form.getByLabelText('Título do projeto *')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Tela do projeto')).not.toBeInTheDocument();
  });

  it('salvar rascunho não conclui a inscrição e o rascunho volta ao reabrir', async () => {
    const user = userEvent.setup();
    renderPage();
    const form = await findForm();

    await user.type(form.getByLabelText('Título do projeto *'), 'Ideia inicial');
    await user.click(form.getByRole('button', { name: 'Salvar rascunho' }));

    expect(
      await form.findByText(/^Rascunho salvo às \d{2}:\d{2} · Ainda não cadastrado$/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Tela do projeto')).not.toBeInTheDocument();
    // O projeto continua sem cadastro na API.
    await expect(http.get('/api/teams/12/project')).rejects.toMatchObject({
      response: { status: 404 },
    });

    // Reabrindo a tela, o rascunho volta preenchido.
    cleanup();
    renderPage();
    expect(await screen.findByDisplayValue('Ideia inicial')).toBeInTheDocument();
  });

  it('cadastra o projeto e leva a equipe para a tela do Projeto', async () => {
    const user = userEvent.setup();
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
      location: 'Campus sede',
    });
  });

  it('mostra no campo o título já usado na edição', async () => {
    const user = userEvent.setup();
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

  it('com o projeto já cadastrado, vai direto para a tela do Projeto', async () => {
    await http.put('/api/teams/12/project', {
      challenge_id: 17,
      category_id: 1,
      title: 'AgroConecta',
      summary: 'Resumo',
      objective: 'Objetivo',
    });
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
      http.put('/api/teams/12/project', {
        challenge_id: 17,
        category_id: 1,
        title: 'X',
        summary: 'Y',
        objective: null,
      }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it('aluno sem equipe é levado a encontrar uma equipe', async () => {
    await signIn('sem-equipe@exemplo.com');
    renderPage();

    expect(await screen.findByText('Você ainda não participa de uma equipe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Encontrar equipe' })).toBeInTheDocument();
  });
});
