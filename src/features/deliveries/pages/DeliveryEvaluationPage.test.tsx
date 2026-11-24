import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http as mswHttp, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/router/routes';
import { AuthProvider, simulateMicrosoftLogin } from '@/features/auth';
import { server } from '@/mocks/server';
import { http } from '@/shared/lib/http';

async function renderTeacher(path: string) {
  await simulateMicrosoftLogin('professor@exemplo.com');
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

const CRITERIA = [
  'Definição do problema',
  'Objetivos e justificativa',
  'Planejamento e cronograma',
  'Organização do material',
];
const score = (name: string) => screen.getByRole('textbox', { name: `Nota: ${name}` });

function fillScores(values: string[]) {
  CRITERIA.forEach((name, index) => {
    fireEvent.change(score(name), { target: { value: values[index] } });
  });
}

describe('Avaliação da entrega: preencher e publicar', () => {
  it('mostra o contexto, o material enviado e a rubrica vazia', async () => {
    await renderTeacher('/professor/entregas/d1');

    expect(await screen.findByText('Portal de Extensão • Equipe Aurora')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Acompanhamento do curso / Sistemas de Informação / Portal de Extensão / Etapa 2',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Etapa 2 — Proposta e planejamento • Prazo: 07/10/2026 • Nota máxima: 10,0'),
    ).toBeInTheDocument();
    expect(screen.getByText('Pendente de Avaliação')).toBeInTheDocument();

    expect(
      screen.getByText('Enviado por Ana Souza, líder da equipe, em 06/10/2026 às 14h32.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Proposta_Aurora.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF • 1,8 MB • Documento principal')).toBeInTheDocument();
    expect(screen.getByText('XLSX • 124 KB • Planejamento')).toBeInTheDocument();
    expect(screen.getByText('4 integrantes • Líder atual: Ana Souza')).toBeInTheDocument();

    // Leva à tela de detalhes do projeto, guardando o caminho de volta para a avaliação.
    expect(screen.getByRole('link', { name: 'Ver mais detalhes do projeto' })).toHaveAttribute(
      'href',
      expect.stringContaining('/projetos/501'),
    );

    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    CRITERIA.forEach((name) => expect(score(name)).toHaveValue(''));
    expect(screen.getByText('0,0 / 10,0')).toBeInTheDocument();
  });

  it('o total acompanha a digitação', async () => {
    await renderTeacher('/professor/entregas/d1');
    await screen.findByText('Rascunho');

    fillScores(['1,5', '2,5', '2', '2']);

    expect(screen.getByText('8,0 / 10,0')).toBeInTheDocument();
  });

  it('não publica com nota vazia ou acima do máximo', async () => {
    const onPublish = vi.fn();
    server.use(
      mswHttp.put('*/api/teacher/deliveries/:id/evaluation', () => {
        onPublish();
        return HttpResponse.json({});
      }),
    );
    await renderTeacher('/professor/entregas/d1');
    await screen.findByText('Rascunho');

    fireEvent.click(screen.getByRole('button', { name: 'Publicar avaliação' }));
    expect(await screen.findAllByText('Informe a nota.')).toHaveLength(4);

    fillScores(['3,5', '2', '2', 'x']);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar avaliação' }));
    expect(await screen.findByText('A nota máxima é 2,0.')).toBeInTheDocument();
    expect(screen.getByText('Use um número, ex.: 1,5.')).toBeInTheDocument();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('publica, confirma e passa a mostrar a entrega como avaliada no painel', async () => {
    let body: unknown;
    server.use(
      mswHttp.put('*/api/teacher/deliveries/:id/evaluation', async ({ request }) => {
        body = await request.clone().json();
        return undefined; // segue para o handler padrão
      }),
    );
    const router = await renderTeacher('/professor/entregas/d1');
    await screen.findByText('Rascunho');

    fillScores(['1,5', '2,5', '2', '2']);
    fireEvent.change(screen.getByLabelText('Feedback textual à equipe'), {
      target: { value: 'Bom trabalho.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar avaliação' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Avaliação publicada com sucesso' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'A nota e o feedback foram registrados e já estão visíveis para a Equipe Aurora.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('8,0 / 10,0')).toBeInTheDocument();
    expect(screen.getByText('Enviado para a equipe')).toBeInTheDocument();
    expect(body).toEqual({
      scores: [
        { criterion_id: 'c1', score: 1.5 },
        { criterion_id: 'c2', score: 2.5 },
        { criterion_id: 'c3', score: 2 },
        { criterion_id: 'c4', score: 2 },
      ],
      feedback: 'Bom trabalho.',
    });

    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao painel' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/professor'));
    expect(await screen.findByText('3 de 6 avaliados • 50%')).toBeInTheDocument();
  });

  it('"Ver detalhes da entrega" abre a avaliação somente leitura', async () => {
    await renderTeacher('/professor/entregas/d1');
    await screen.findByText('Rascunho');
    fillScores(['1,5', '2,5', '2', '2']);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar avaliação' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes da entrega' }));

    expect(await screen.findByText('Concluído')).toBeInTheDocument();
    expect(score('Definição do problema')).toHaveAttribute('readonly');
    expect(score('Definição do problema')).toHaveValue('1,5');
    expect(screen.queryByRole('button', { name: 'Publicar avaliação' })).not.toBeInTheDocument();
  });

  it('mostra a mensagem da API quando a publicação falha e mantém o formulário', async () => {
    server.use(
      mswHttp.put('*/api/teacher/deliveries/:id/evaluation', () =>
        HttpResponse.json(
          { error: { code: 'invalid', message: 'Prazo encerrado.', details: null } },
          { status: 422 },
        ),
      ),
    );
    await renderTeacher('/professor/entregas/d1');
    await screen.findByText('Rascunho');
    fillScores(['1', '1', '1', '1']);

    fireEvent.click(screen.getByRole('button', { name: 'Publicar avaliação' }));

    expect(await screen.findByText('Prazo encerrado.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar avaliação' })).toBeEnabled();
    expect(score('Definição do problema')).toHaveValue('1');
  });
});

describe('Avaliação da entrega: consulta', () => {
  it('entrega já avaliada abre somente leitura, com notas e feedback', async () => {
    await renderTeacher('/professor/entregas/d5');

    expect(await screen.findByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Avaliado')).toBeInTheDocument();
    CRITERIA.forEach((name) => expect(score(name)).toHaveAttribute('readonly'));
    expect(score('Definição do problema')).toHaveValue('1,5');
    expect(screen.getByText('8,0 / 10,0')).toBeInTheDocument();
    expect(screen.getByText(/A proposta está bem estruturada/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publicar avaliação' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao painel' })).toHaveAttribute(
      'href',
      '/professor',
    );
  });

  it('entrega inexistente mostra "não encontrada" com volta ao painel', async () => {
    await renderTeacher('/professor/entregas/zzz');

    expect(await screen.findByText('Entrega não encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao painel' })).toBeInTheDocument();
  });

  it('só professor acessa a API da entrega', async () => {
    await simulateMicrosoftLogin('academico@exemplo.com');

    await expect(http.get('/api/teacher/deliveries/d1')).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

describe('Avaliação da entrega: navegação a partir do painel', () => {
  it('"Avaliar entrega" abre a rubrica da entrega escolhida', async () => {
    const router = await renderTeacher('/professor');

    const row = (await screen.findByText('Biblioteca Conectada')).closest('tr')!;
    fireEvent.click(within(row).getByRole('link', { name: 'Avaliar entrega' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/professor/entregas/d2'));
    expect(await screen.findByText('Biblioteca Conectada • Equipe Nexo')).toBeInTheDocument();
  });
});
