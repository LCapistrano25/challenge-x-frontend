import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mockHttp, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { http } from '@/shared/lib/http';
import { EvaluationFormPage } from './EvaluationFormPage';

function renderForm(projectId: number) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/avaliador/projetos/${projectId}/avaliar`]}>
        <Routes>
          <Route path="/avaliador/projetos/:projectId/avaliar" element={<EvaluationFormPage />} />
          <Route path="/avaliador/projetos/:projectId" element={<p>Detalhe do projeto</p>} />
          <Route path="/avaliador" element={<p>Projetos finalistas</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const score = (criterion: string) => screen.getByLabelText(`Nota atribuída a ${criterion}`);
const justification = (criterion: string) =>
  screen.getByLabelText(`Justificativa da nota de ${criterion}`);
const reviewButton = () => screen.getByRole('button', { name: 'Revisar avaliação' });

async function goToReview() {
  await userEvent.click(await screen.findByRole('button', { name: 'Revisar avaliação' }));
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Revisão da avaliação' }),
  ).toBeInTheDocument();
}

describe('EvaluationFormPage', () => {
  beforeEach(async () => {
    await http.post('/auth/login', { email: 'avaliador@exemplo.com', password: '123456' });
  });

  it('mostra o total, a soma das notas e a configuração da etapa', async () => {
    renderForm(40);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Avaliar projeto finalista' }),
    ).toBeInTheDocument();
    expect(screen.getByText('86 / 100 pontos')).toBeInTheDocument();
    expect(screen.getByText('18 + 16 + 18 + 16 + 18 = 86')).toBeInTheDocument();
    expect(
      screen.getByText(
        '5 critérios × 20 pontos = 100 pontos. Notas de 0 a 20, sem pesos adicionais. Critérios e limites definidos pelo administrador.',
      ),
    ).toBeInTheDocument();
  });

  it('bloqueia a revisão com nota fora do limite e justificativa vazia', async () => {
    renderForm(40);
    const relevance = 'Relevância e impacto social';
    await screen.findByRole('heading', { level: 1, name: 'Avaliar projeto finalista' });

    await userEvent.type(score(relevance), '4'); // 18 → 184
    await userEvent.clear(justification(relevance));
    await userEvent.click(reviewButton());

    expect(screen.getByText('Revise 2 campos antes de continuar')).toBeInTheDocument();
    expect(
      screen.getByText(
        'A nota de Relevância e impacto social está fora do limite e a justificativa é obrigatória. Os demais dados foram preservados.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Informe de 0 a 20.')).toBeInTheDocument();
    expect(screen.getByText('Justifique a nota para continuar.')).toBeInTheDocument();
    expect(screen.getByText('Total indisponível')).toBeInTheDocument();
    expect(reviewButton()).toBeDisabled();
    // Os demais dados continuam preenchidos.
    expect(score('Inovação e criatividade')).toHaveValue('16');

    // Corrigindo os dois campos, a revisão volta a ficar disponível.
    await userEvent.type(score(relevance), '{Backspace}');
    await userEvent.type(justification(relevance), 'Ok');

    expect(screen.queryByText('Revise 2 campos antes de continuar')).not.toBeInTheDocument();
    expect(reviewButton()).toBeEnabled();
  });

  it('recalcula o total ao mudar uma nota', async () => {
    renderForm(40);
    const relevance = 'Relevância e impacto social';
    await screen.findByRole('heading', { level: 1, name: 'Avaliar projeto finalista' });

    await userEvent.type(score(relevance), '{Backspace}{Backspace}20');

    expect(screen.getByText('88 / 100 pontos')).toBeInTheDocument();
    expect(screen.getByText('20 + 16 + 18 + 16 + 18 = 88')).toBeInTheDocument();
  });

  it('exige o parecer final com pelo menos 50 caracteres', async () => {
    renderForm(40);
    const feedback = await screen.findByLabelText('Parecer final *');

    await userEvent.clear(feedback);
    await userEvent.type(feedback, 'Muito bom.');
    await userEvent.click(reviewButton());

    expect(screen.getByText('Revise 1 campo antes de continuar')).toBeInTheDocument();
    expect(screen.getByText('Escreva pelo menos 50 caracteres.')).toBeInTheDocument();
  });

  it('revisa, exige a confirmação e envia uma única vez, exibindo o protocolo', async () => {
    let requests = 0;
    server.use(
      mockHttp.put('*/api/evaluator/finalists/40/final-evaluation', () => {
        requests += 1;
        return undefined;
      }),
    );
    renderForm(40);
    await goToReview();

    expect(screen.getByText('✓ Preenchimento concluído')).toBeInTheDocument();
    expect(
      screen.getByText('Comentário: Conexão clara entre a comunidade e as ações de extensão.'),
    ).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Confirmar e enviar avaliação' });
    expect(send).toBeDisabled();

    await userEvent.click(
      screen.getByLabelText(
        'Revisei as notas e os pareceres. Confirmo o envio definitivo desta avaliação.',
      ),
    );
    await userEvent.dblClick(send);

    expect(
      await screen.findByRole('heading', { name: 'Avaliação enviada com sucesso' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Protocolo: AV-2026-014-EA/)).toBeInTheDocument();
    expect(screen.getByText('86 / 100 pontos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver avaliação enviada' })).toBeInTheDocument();
    // Um PUT de rascunho ao revisar e um único PUT de envio definitivo.
    expect(requests).toBe(2);
  });

  it('mantém os dados e oferece novo envio quando a conexão falha', async () => {
    server.use(
      mockHttp.put('*/api/evaluator/finalists/:projectId/final-evaluation', async ({ request }) => {
        const body = (await request.clone().json()) as { status: string };
        return body.status === 'FINALIZED' ? HttpResponse.error() : undefined;
      }),
    );
    renderForm(40);
    await goToReview();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar avaliação' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Revisão · Envio não concluído' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Não foi possível enviar sua avaliação')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Relevância e impacto social' })).getByText(
        '18 / 20 pontos',
      ),
    ).toBeInTheDocument();

    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar enviar novamente' }));
    expect(
      await screen.findByRole('heading', { name: 'Avaliação enviada com sucesso' }),
    ).toBeInTheDocument();
  });

  it('abre a consulta quando a avaliação já foi enviada (somente leitura)', async () => {
    renderForm(44);

    expect(await screen.findByText('Detalhe do projeto')).toBeInTheDocument();
  });
});
