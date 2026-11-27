import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { resetAdminEditionSelection } from '../hooks/useAdminEdition';
import { EvaluatorInvitePage } from './EvaluatorInvitePage';
import { EvaluatorManagePage } from './EvaluatorManagePage';
import { EvaluatorsPage } from './EvaluatorsPage';
import { RegulationFormPage } from './RegulationFormPage';
import { RegulationPublishPage } from './RegulationPublishPage';
import { RegulationViewPage } from './RegulationViewPage';
import { RegulationsPage } from './RegulationsPage';

function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {content && (
          <header>
            {content.eyebrow && <span>{content.eyebrow}</span>}
            <h1>{content.title}</h1>
            {content.actions}
          </header>
        )}
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <HeaderProbe>
            <Routes>
              <Route path="/admin/editais" element={<RegulationsPage />} />
              <Route path="/admin/editais/novo" element={<RegulationFormPage />} />
              <Route path="/admin/editais/:regulationId" element={<RegulationViewPage />} />
              <Route path="/admin/editais/:regulationId/editar" element={<RegulationFormPage />} />
              <Route
                path="/admin/editais/:regulationId/publicar"
                element={<RegulationPublishPage />}
              />
              <Route path="/admin/avaliadores" element={<EvaluatorsPage />} />
              <Route path="/admin/avaliadores/novo" element={<EvaluatorInvitePage />} />
              <Route path="/admin/avaliadores/:linkId" element={<EvaluatorManagePage />} />
            </Routes>
          </HeaderProbe>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const rowOf = (text: string | RegExp) => within(screen.getAllByText(text)[0]!.closest('tr')!);
const pdf = (name = 'edital-2026-v3.pdf') =>
  new File(['%PDF-1.4 conteúdo do edital'], name, { type: 'application/pdf' });
const attach = (file: File) =>
  fireEvent.change(screen.getByTestId('regulation-file'), { target: { files: [file] } });

beforeEach(async () => {
  resetAdminEditionSelection();
  await http.post('/api/auth/sessions/password', {
    email: 'admin@exemplo.com',
    password: '123456',
  });
});

describe('Editais', () => {
  it('lista as versões com a situação e as ações de cada uma', async () => {
    renderAt('/admin/editais');

    expect(await screen.findByRole('heading', { level: 1, name: 'Editais' })).toBeVisible();
    expect(screen.getByText('ADMINISTRAÇÃO / EDITAIS')).toBeInTheDocument();
    await screen.findByText('Edital de participação Desafio X 2027');
    const draft = rowOf('Edital de participação Desafio X 2027');
    expect(draft.getByText('Minuta')).toBeInTheDocument();
    expect(draft.getByRole('link', { name: /^Editar/ })).toHaveAttribute(
      'href',
      '/admin/editais/701/editar',
    );
    const published = rowOf('v2');
    expect(published.getByText('Publicado', { selector: 'span' })).toBeInTheDocument();
    expect(published.getByRole('button', { name: /^Baixar/ })).toBeVisible();
    expect(screen.getAllByRole('link', { name: /^Consultar/ })).toHaveLength(1);
    expect(screen.getByText('1–3 de 3 documentos')).toBeInTheDocument();
    expect(screen.getByText('Minuta de 2027 aguardando aprovação')).toBeInTheDocument();

    const user = userEvent.setup({ delay: null });
    await user.selectOptions(screen.getByLabelText('Filtrar por situação'), 'SUPERSEDED');
    expect(screen.getByText('1–1 de 1 documento')).toBeInTheDocument();
  });

  it('rejeita arquivo que não é PDF e salva a minuta com PDF válido', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/editais/novo');

    await user.type(await screen.findByLabelText('Título *'), 'Edital de participação 2027');
    await user.type(screen.getByLabelText(/^Descrição \*/), 'Regras de participação.');
    // 2027 já tem minuta em aberto: a nova versão sai dela.
    expect(screen.getByLabelText('Edição *')).toHaveValue('7');
    expect(screen.getByText('Já existe a minuta da versão 1 nesta edição')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Edição *'), '3');
    expect(screen.getByLabelText('Versão')).toHaveValue('Versão 3 • definida ao salvar');
    const save = screen.getByRole('button', { name: 'Salvar minuta' });
    expect(save).toBeDisabled();

    attach(
      new File(['PK'], 'edital.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    );
    expect(
      await screen.findByText('Arquivo rejeitado na última tentativa: edital.docx'),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Formato não aceito/)).toBeInTheDocument();
    expect(save).toBeDisabled();

    attach(pdf());
    expect(await screen.findByText('edital-2026-v3.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/Arquivo rejeitado/)).not.toBeInTheDocument();
    await user.click(save);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Visualizar edital' }),
    ).toBeVisible();
    expect(await screen.findByText(/edital-2026-v3\.pdf • .* • Versão 3/)).toBeInTheDocument();
    expect(screen.getByText('Minuta • não publicada')).toBeInTheDocument();
  });

  it('preserva a versão publicada: a alteração gera uma nova versão', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/editais/302/editar');

    expect(await screen.findByText('A versão publicada é preservada')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Criar nova versão' }));

    expect(await screen.findByText('Nova versão a partir da versão 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Título *')).toHaveValue('Edital de participação Desafio X 2026');
    expect(screen.getByLabelText('Edição *')).toBeDisabled();
    expect(screen.getByLabelText('Versão')).toHaveValue('Versão 3 • definida ao salvar');
    attach(pdf());
    expect(await screen.findByText('edital-2026-v3.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar minuta' }));
    expect(await screen.findByText(/Versão 3$/)).toBeInTheDocument();

    const { data } = await http.get('/api/admin/regulations', { params: { edition_id: 3 } });
    const byVersion = Object.fromEntries(
      (data as { version: number; status: string }[]).map((r) => [r.version, r.status]),
    );
    expect(byVersion).toMatchObject({ 2: 'PUBLISHED', 3: 'DRAFT' });
  });

  it('publicação: checklist bloqueia enquanto há pendências', async () => {
    renderAt('/admin/editais/701/publicar');

    expect(await screen.findByText('Checklist de publicação')).toBeInTheDocument();
    expect(await screen.findByText('4 convites aguardam confirmação.')).toBeInTheDocument();
    expect(screen.getByText(/Rubrica a revisar: Resultado e evidências/)).toBeInTheDocument();
    expect(screen.getByText('2,0 + 3,0 + 3,0 + 2,0 = 10,0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar edital' })).toBeDisabled();
  });

  it('publica minuta de edição já publicada e substitui a versão anterior', async () => {
    const form = new FormData();
    form.append('title', 'Edital de participação Desafio X 2026');
    form.append('description', 'Correção do cronograma.');
    form.append('file', pdf());
    const { data: draft } = await http.post<{ id: number }>(
      '/api/admin/editions/3/regulations',
      form,
    );

    const user = userEvent.setup({ delay: null });
    renderAt(`/admin/editais/${draft.id}/publicar`);
    const publish = await screen.findByRole('button', { name: 'Publicar edital' });
    await waitFor(() => expect(publish).toBeEnabled());
    expect(screen.getByText(/A versão 2 passará a substituída/)).toBeInTheDocument();
    await user.click(publish);
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Publicar edital' }),
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Visualizar edital' }),
    ).toBeVisible();
    const { data } = await http.get('/api/admin/regulations', { params: { edition_id: 3 } });
    const byVersion = Object.fromEntries(
      (data as { version: number; status: string }[]).map((r) => [r.version, r.status]),
    );
    expect(byVersion).toMatchObject({ 1: 'SUPERSEDED', 2: 'SUPERSEDED', 3: 'PUBLISHED' });
  });
});

describe('Avaliadores externos', () => {
  it('lista convites e atribuições da edição', async () => {
    renderAt('/admin/avaliadores');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Avaliadores externos' }),
    ).toBeVisible();
    expect(await screen.findByText('Vinculados à edição')).toBeInTheDocument();
    expect(screen.getByText('Convites aceitos').nextElementSibling).toHaveTextContent('4');
    expect(screen.getByText('Convites pendentes').nextElementSibling).toHaveTextContent('4');
    expect(rowOf('Ana Ribeiro').getByText('Conecta · Apresentação')).toBeInTheDocument();
    expect(
      rowOf('Ana Ribeiro').getByRole('link', { name: 'Gerenciar Ana Ribeiro' }),
    ).toHaveAttribute('href', '/admin/avaliadores/601');
    expect(screen.getByText('1–5 de 8 avaliadores')).toBeInTheDocument();
    expect(screen.getByText('4 convites precisam de confirmação')).toBeInTheDocument();

    const user = userEvent.setup({ delay: null });
    await user.selectOptions(screen.getByLabelText('Filtrar por convite'), 'PENDING');
    const pending = rowOf('Elisa Nogueira');
    expect(pending.getByText('Aguardando confirmação')).toBeInTheDocument();
    await user.click(pending.getByRole('button', { name: 'Reenviar convite para Elisa Nogueira' }));
    await waitFor(async () => {
      const { data } = await http.get<{ id: number; invitation: { sent_at: string } }[]>(
        '/api/admin/editions/7/evaluators',
      );
      expect(data.find((item) => item.id === 605)!.invitation.sent_at).not.toBe(
        '2026-11-04T13:00:00Z',
      );
    });
  });

  it('estado vazio e vínculo de avaliador do catálogo', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/avaliadores');
    await user.selectOptions(await screen.findByLabelText('Edição atual'), '3');

    expect(await screen.findByText('Vincule os avaliadores da edição')).toBeInTheDocument();
    expect(screen.getByText('0 avaliadores vinculados • 0 convites enviados')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar avaliador externo' })).toHaveAttribute(
      'href',
      '/admin/avaliadores/novo',
    );

    await user.click(screen.getByRole('button', { name: 'Vincular avaliador existente' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(await dialog.findByLabelText(/Isabela Torres/));
    await user.click(dialog.getByRole('button', { name: 'Vincular à edição' }));

    expect(await screen.findByText('Isabela Torres')).toBeInTheDocument();
    expect(rowOf('Isabela Torres').getByText('Pendente')).toBeInTheDocument();
  });

  it('atribuição só é liberada depois do aceite', async () => {
    renderAt('/admin/avaliadores/605');

    expect(await screen.findByText('Atribuições bloqueadas')).toBeInTheDocument();
    expect(screen.getByText(/depois que o avaliador aceitar o convite/)).toBeInTheDocument();
    expect(screen.getByLabelText('Adicionar equipe *')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Adicionar atribuição' })).toBeDisabled();
    expect(screen.getByText('Convite pendente')).toBeInTheDocument();
  });

  it('avaliador com convite aceito recebe equipe e etapa', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/avaliadores/601');

    expect(await screen.findByText('Convite aceito')).toBeInTheDocument();
    expect(screen.getByText(/Ana Ribeiro • Instituto Saúde Coletiva/)).toBeInTheDocument();
    expect(rowOf('Conecta').getByText('Apresentação')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Adicionar equipe *'), '81');
    await user.selectOptions(screen.getByLabelText('Etapa *'), '74');
    await user.click(screen.getByRole('button', { name: 'Adicionar atribuição' }));
    expect(
      screen.getByText('A equipe já está atribuída ao avaliador nesta etapa.'),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Adicionar equipe *'), '82');
    await user.selectOptions(screen.getByLabelText('Etapa *'), '73');
    await user.click(screen.getByRole('button', { name: 'Adicionar atribuição' }));
    expect(rowOf('Aurora').getByText('Entrega')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar vínculos' }));

    expect(await screen.findByText('1–5 de 8 avaliadores')).toBeInTheDocument();
    expect(rowOf('Ana Ribeiro').getByText('Conecta · Apresentação +1')).toBeInTheDocument();
  });

  it('cadastro com convite valida os campos e envia o convite', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/avaliadores/novo');

    await user.click(await screen.findByRole('button', { name: 'Cadastrar e enviar convite' }));
    expect(screen.getByText('Informe o nome completo.')).toBeInTheDocument();
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Selecione a área de atuação.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nome completo *'), 'Laura Mendes');
    await user.type(screen.getByLabelText('E-mail *'), 'ana.ribeiro@saudecoletiva.org');
    expect(screen.getByText('Este avaliador já está vinculado à edição.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('E-mail *'));
    await user.type(screen.getByLabelText('E-mail *'), 'laura@ong.org');
    await user.type(screen.getByLabelText('Telefone'), '63999990000');
    expect(screen.getByLabelText('Telefone')).toHaveValue('(63) 99999-0000');
    await user.type(screen.getByLabelText('Instituição ou organização *'), 'ONG Cuidar');
    await user.selectOptions(screen.getByLabelText('Especialidade *'), 'Saúde coletiva');
    await user.click(screen.getByRole('button', { name: 'Cadastrar e enviar convite' }));

    expect(await screen.findByText('1–5 de 9 avaliadores')).toBeInTheDocument();
  });
});
