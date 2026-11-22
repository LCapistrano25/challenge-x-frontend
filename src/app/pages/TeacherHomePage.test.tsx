import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http as mswHttp, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/router/routes';
import { AuthProvider, simulateMicrosoftLogin } from '@/features/auth';
import { server } from '@/mocks/server';
import { http } from '@/shared/lib/http';

async function renderTeacher(path = '/professor') {
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

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('Painel de acompanhamento do professor', () => {
  it('mostra o título no cabeçalho, o resumo, o progresso, o prazo e a prioridade', async () => {
    await renderTeacher();

    expect(
      await screen.findByRole('heading', { name: 'Olá, Paulo!' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Bem-vindo ao seu painel de acompanhamento.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Projetos nos cursos vinculados').closest('div')).toHaveTextContent(
      '6',
    );
    expect(screen.getByText('Entregas que faltam avaliar').closest('div')).toHaveTextContent('3');
    expect(screen.getByText('Entregas avaliadas').closest('div')).toHaveTextContent('2');

    expect(screen.getByText('2 de 6 avaliados • 33%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /progresso/i })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    expect(
      screen.getByText('Prazo para concluir as avaliações: 23 de outubro de 2026'),
    ).toBeInTheDocument();
    expect(screen.getByText('4 projetos aguardam sua avaliação.')).toBeInTheDocument();
    expect(
      screen.getByText(/Comece pelo Portal de Extensão, da Equipe Aurora/),
    ).toBeInTheDocument();
  });

  it('lista as seis entregas com status, envio e ação', async () => {
    await renderTeacher();
    await screen.findByRole('table');

    expect(rows()).toHaveLength(6);
    const first = within(rows()[0]!);
    expect(first.getByText('Portal de Extensão')).toBeInTheDocument();
    expect(first.getByText('06/10 • 14h32')).toBeInTheDocument();
    expect(first.getByText('Pendente de Avaliação')).toBeInTheDocument();
    expect(first.getByRole('link', { name: 'Avaliar entrega' })).toHaveAttribute(
      'href',
      '/professor/entregas/d1',
    );
    expect(within(rows()[3]!).getByRole('link', { name: 'Ver material' })).toBeInTheDocument();
    expect(within(rows()[5]!).getByRole('link', { name: 'Ver avaliação' })).toBeInTheDocument();
    expect(
      screen.getByText('Exibindo 6 de 6 projetos • Ordenados por prioridade de avaliação'),
    ).toBeInTheDocument();
  });

  it('filtra por status, por curso e por texto', async () => {
    await renderTeacher();
    await screen.findByRole('table');

    fireEvent.change(screen.getByLabelText('Status da entrega'), {
      target: { value: 'EVALUATED' },
    });
    expect(rows()).toHaveLength(2);
    expect(screen.getByText(/Exibindo 2 de 6 projetos/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status da entrega'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Curso vinculado'), {
      target: { value: 'Sistemas de Informação' },
    });
    expect(rows()).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('Curso vinculado'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Buscar projeto ou equipe'), {
      target: { value: 'aurora' },
    });
    expect(rows()).toHaveLength(1);
    expect(screen.getByText('Portal de Extensão')).toBeInTheDocument();
  });

  it('mostra o estado vazio e permite limpar os filtros', async () => {
    await renderTeacher();
    await screen.findByRole('table');

    fireEvent.change(screen.getByLabelText('Buscar projeto ou equipe'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByRole('heading', { name: 'Nenhum projeto encontrado' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]!);
    expect(rows()).toHaveLength(6);
  });

  it('"Avaliar próximo projeto" leva à entrega de maior prioridade', async () => {
    const router = await renderTeacher();

    fireEvent.click(await screen.findByRole('link', { name: 'Avaliar próximo projeto' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/professor/entregas/d1'));
    expect(
      await screen.findByRole('heading', { name: 'Avaliação da Entrega' }),
    ).toBeInTheDocument();
  });

  it('mostra erro com opção de tentar de novo', async () => {
    server.use(
      mswHttp.get('*/api/teacher/dashboard', () =>
        HttpResponse.json({ message: 'erro' }, { status: 500 }),
      ),
    );
    await renderTeacher();

    expect(await screen.findByText('Não foi possível carregar o painel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('só professor acessa a API do painel', async () => {
    await simulateMicrosoftLogin('academico@exemplo.com');

    await expect(http.get('/api/teacher/dashboard')).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});
