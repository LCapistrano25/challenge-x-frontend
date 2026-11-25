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
import { CriteriaRubricsPage } from './CriteriaRubricsPage';
import { RubricsPage } from './RubricsPage';
import { ScoresPage } from './ScoresPage';
import { StageFormPage } from './StageFormPage';
import { StagesPage } from './StagesPage';

/** Mostra o que a página manda para o cabeçalho do layout (título, sobretítulo e ações). */
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
              <Route path="/admin/etapas" element={<StagesPage />} />
              <Route path="/admin/etapas/nova" element={<StageFormPage />} />
              <Route path="/admin/etapas/:stageId" element={<StageFormPage />} />
              <Route path="/admin/criterios-rubricas" element={<CriteriaRubricsPage />} />
              <Route path="/admin/criterios-rubricas/rubricas" element={<RubricsPage />} />
              <Route path="/admin/criterios-rubricas/pontuacoes" element={<ScoresPage />} />
            </Routes>
          </HeaderProbe>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const rowOf = (text: string) => within(screen.getByText(text).closest('tr')!);

describe('Configuração da avaliação (administração)', () => {
  beforeEach(async () => {
    resetAdminEditionSelection();
    await http.post('/api/auth/sessions/password', {
      email: 'admin@exemplo.com',
      password: '123456',
    });
  });

  it('lista as etapas da edição em configuração com o resumo da pontuação', async () => {
    renderAt('/admin/etapas');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Etapas da edição' }),
    ).toBeVisible();
    expect(screen.getByText('ADMINISTRAÇÃO / ETAPAS')).toBeInTheDocument();
    expect(await screen.findByLabelText('Edição atual')).toHaveValue('7');
    expect(screen.getByText('Em configuração')).toBeInTheDocument();

    expect(await screen.findByText('1 · Ideação')).toBeInTheDocument();
    const entrega = rowOf('3 · Entrega');
    expect(entrega.getByText('03/05 a 14/05/2027')).toBeInTheDocument();
    expect(entrega.getByText('Resultado e evidências')).toBeInTheDocument();
    expect(entrega.getByText('3,0')).toBeInTheDocument();
    expect(entrega.getByRole('link', { name: 'Editar Entrega' })).toHaveAttribute(
      'href',
      '/admin/etapas/73',
    );
    expect(rowOf('4 · Apresentação').getByText(/Clareza da apresentação, Domínio/)).toBeVisible();

    expect(screen.getByText('10,0 / 10,0')).toBeInTheDocument();
    expect(screen.getByText('Soma exata atendida')).toBeInTheDocument();
    expect(screen.getByText('1–4 de 4 etapas')).toBeInTheDocument();
    expect(screen.getByText('Cronologia e pontuação válidas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar etapa' })).toHaveAttribute(
      'href',
      '/admin/etapas/nova',
    );
  });

  it('rejeita prazo posterior à avaliação técnica e salva a data corrigida', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/etapas/73');

    // Espera o formulário montar: durante o carregamento a trilha é outro elemento.
    const end = await screen.findByLabelText('Fim *');
    expect(end).toHaveValue('2027-05-14');
    expect(
      screen.getByText('Entrega • 3ª etapa • Configuração salva: 03/05 a 14/05/2027.'),
    ).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Salvar etapa' });
    expect(save).toBeDisabled();

    fireEvent.change(end, { target: { value: '2027-05-30' } });
    expect(await screen.findByText('Deve ocorrer antes de 28/05/2027.')).toBeInTheDocument();
    expect(screen.getByText('Cronologia inválida')).toBeInTheDocument();
    expect(
      screen.getByText(/O prazo proposto de 30\/05 é posterior à avaliação técnica/),
    ).toHaveTextContent(
      'Defina uma data entre 03/05 e 27/05/2027. O prazo salvo permanece 14/05/2027.',
    );
    expect(save).toBeDisabled();
    expect(
      screen.getByRole('heading', { name: 'Prazos da etapa • alteração não salva' }),
    ).toBeVisible();

    fireEvent.change(end, { target: { value: '2027-05-13' } });
    expect(screen.queryByText('Cronologia inválida')).not.toBeInTheDocument();
    expect(save).toBeEnabled();
    await user.click(save);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Etapas da edição' }),
    ).toBeVisible();
    expect(await screen.findByText('03/05 a 13/05/2027')).toBeInTheDocument();
  });

  it('cadastro: bloqueia salvar enquanto faltam dados e quando a soma passa de 10,0', async () => {
    renderAt('/admin/etapas/nova');

    expect(await screen.findByLabelText('Ordem *')).toHaveValue('5');
    expect(screen.getByLabelText('Status')).toHaveValue('Planejada');
    expect(screen.getByRole('button', { name: 'Salvar etapa' })).toBeDisabled();
    expect(
      screen.getByText(
        'Preencha os campos obrigatórios e ajuste a distribuição para manter o total de 10,0.',
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pontuação máxima *'), { target: { value: '1,0' } });
    expect(
      await screen.findByText('A soma das etapas passaria de 10,0 (ficaria 11,0).'),
    ).toBeInTheDocument();
    expect(screen.getByText('A edição já tem 4 etapas e 10,0 pontos')).toBeInTheDocument();
  });

  it('pontuações: salvar fica bloqueado se a soma for diferente de 10,0', async () => {
    renderAt('/admin/criterios-rubricas/pontuacoes');

    expect(await screen.findByText('Pontuação válida: 10,0 de 10,0 pontos')).toBeInTheDocument();
    expect(
      screen.getByText('2,0 + 3,0 + 3,0 + 2,0 = 10,0 • Soma exata obrigatória.'),
    ).toBeVisible();
    expect(rowOf('Total salvo').getByText('Válido')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Salvar pontuações' });
    expect(save).toBeDisabled();

    const entrega = screen.getByLabelText('Entrega *');
    fireEvent.change(entrega, { target: { value: '3,5' } });
    expect(await screen.findByText('A soma excede o total.')).toBeInTheDocument();
    expect(screen.getByText('Não é possível salvar: soma de 10,5 pontos')).toBeInTheDocument();
    expect(
      screen.getByText('Salvar bloqueado até que a soma seja exatamente 10,0 pontos.'),
    ).toBeInTheDocument();
    expect(save).toBeDisabled();

    // A etapa não pode ficar abaixo da soma dos próprios critérios.
    fireEvent.change(screen.getByLabelText('Ideação *'), { target: { value: '1,5' } });
    expect(await screen.findByText('Os critérios desta etapa somam 2,0.')).toBeInTheDocument();
    expect(save).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(screen.getByLabelText('Entrega *')).toHaveValue('3,0');
  });

  it('critérios: a soma não passa do limite da etapa; salva dentro do limite', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/criterios-rubricas');

    expect(await screen.findByText('1–6 de 6 critérios')).toBeInTheDocument();
    expect(rowOf('Resultado e evidências').getByText('A revisar')).toBeInTheDocument();
    expect(rowOf('Problema e relevância').getByText('Revisada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar Clareza da apresentação' }));
    expect(screen.getByText('Critério selecionado: Clareza da apresentação')).toBeInTheDocument();
    const max = screen.getByLabelText('Pontuação máxima *');
    expect(max).toHaveValue('0,8');
    expect(screen.getByText(/A soma dos critérios de Apresentação deve respeitar/)).toBeVisible();

    await user.clear(max);
    await user.type(max, '1,0');
    await user.click(screen.getByRole('button', { name: 'Salvar critério' }));
    expect(
      await screen.findByText(
        'A soma dos critérios de Apresentação passaria do limite da etapa (2,2 de 2,0).',
      ),
    ).toBeInTheDocument();

    await user.clear(max);
    await user.type(max, '0,7');
    await user.click(screen.getByRole('button', { name: 'Salvar critério' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Salvar critério' })).not.toBeInTheDocument(),
    );
    expect(await rowOf('Clareza da apresentação').findByText('0,7')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrar por'), '73');
    expect(screen.getByText('1–1 de 1 critério')).toBeInTheDocument();
  });

  it('rubricas: edita o nível pela matriz respeitando o máximo do critério', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/criterios-rubricas/rubricas');

    expect(
      await screen.findByRole('heading', { name: 'Matriz da etapa Apresentação' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Apresentação • Máximo 2,0 pontos • Clareza da apresentação 0,8 + Domínio da proposta 0,8 + Respostas à banca 0,4',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('0,8 • Síntese clara do problema, solução e impacto.')).toBeVisible();
    expect(screen.getByText('2 rubricas aguardam revisão')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Domínio da proposta, Excelente/ }));
    expect(screen.getByText('Domínio da proposta • Excelente')).toBeInTheDocument();
    expect(screen.getByText('Intervalo permitido: 0,0 a 0,8.')).toBeInTheDocument();

    const points = screen.getByLabelText('Pontuação *');
    await user.type(points, '0,9');
    await user.type(
      screen.getByLabelText('Descritor *'),
      'Justifica escolhas e reconhece limitações.',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar rubrica' }));
    expect(await screen.findByText('Use um valor de 0,0 a 0,8.')).toBeInTheDocument();

    await user.clear(points);
    await user.type(points, '0,8');
    await user.click(screen.getByRole('button', { name: 'Salvar rubrica' }));
    expect(
      await screen.findByText('0,8 • Justifica escolhas e reconhece limitações.'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 rubrica aguarda revisão')).toBeInTheDocument();
  });

  it('edição publicada: configuração só para consulta', async () => {
    const user = userEvent.setup({ delay: null });
    renderAt('/admin/etapas');

    await user.selectOptions(await screen.findByLabelText('Edição atual'), '3');
    expect(await screen.findByText('Publicada')).toBeInTheDocument();
    expect(await screen.findByText('Configuração somente para consulta')).toBeInTheDocument();
    expect(await screen.findByText('1 · Entrega Preliminar')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cadastrar etapa' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consultar Entrega Preliminar' })).toBeVisible();
  });
});
