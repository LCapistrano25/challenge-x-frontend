import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { http } from '@/shared/lib/http';
import { EvaluationViewPage } from './EvaluationViewPage';
import { FinalistProjectsPage } from './FinalistProjectsPage';
import { MyEvaluationsPage } from './MyEvaluationsPage';

async function loginAs(email: string) {
  await http.post('/auth/login', { email, password: '123456' });
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/avaliador" element={<FinalistProjectsPage />} />
            <Route path="/avaliador/avaliacoes" element={<MyEvaluationsPage />} />
            <Route path="/avaliador/avaliacoes/:projectId" element={<EvaluationViewPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const rowOf = (title: string) =>
  screen.getByRole('link', { name: `Ver avaliação: ${title}` }).closest('li')!;

describe('MyEvaluationsPage', () => {
  it('lista as avaliações enviadas, das mais recentes, com contadores da banca', async () => {
    await loginAs('avaliador@exemplo.com');
    renderAt('/avaliador/avaliacoes');

    expect(await screen.findByRole('heading', { name: 'Avaliações enviadas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2 avaliações enviadas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '4 projetos pendentes' })).toBeInTheDocument();
    expect(screen.getByLabelText('Edição')).toHaveValue('3');

    const links = screen.getAllByRole('link', { name: /^Ver avaliação: / });
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Ver avaliação: Gestão de Laboratórios',
      'Ver avaliação: Rede de Voluntariado',
    ]);
    const labs = within(rowOf('Gestão de Laboratórios'));
    expect(labs.getByText('Final · 2026.1')).toBeInTheDocument();
    expect(labs.getByText('21/10/2026 · 10h15')).toBeInTheDocument();
    expect(labs.getByText('86 / 100')).toBeInTheDocument();
    expect(links[0]).toHaveAttribute('href', '/avaliador/avaliacoes/44');
    expect(screen.queryByRole('textbox', { name: /nota/i })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Buscar avaliação'), 'raiz');
    expect(
      screen.getByText('Exibindo 1 de 2 avaliações · Mais recentes primeiro'),
    ).toBeInTheDocument();
  });

  it('mostra o estado vazio antes do primeiro envio', async () => {
    await loginAs('avaliador.sem-banca@exemplo.com');
    renderAt('/avaliador/avaliacoes');

    expect(
      await screen.findByRole('heading', { name: 'Você ainda não enviou avaliações' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver projetos finalistas' })).toHaveAttribute(
      'href',
      '/avaliador',
    );
  });
});

describe('EvaluationViewPage', () => {
  it('mostra a avaliação publicada sem nenhum campo editável', async () => {
    await loginAs('avaliador@exemplo.com');
    renderAt('/avaliador/avaliacoes/44');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ver avaliação' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Avaliação publicada · Somente leitura')).toBeInTheDocument();
    expect(screen.getByText('86 / 100 pontos')).toBeInTheDocument();
    expect(screen.getByText('AV-2026-030-EA')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Viabilidade técnica' })).getByText(
        'Justificativa: Arquitetura e tecnologias adequadas; ampliar testes de acessibilidade.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('não expõe avaliação ainda não enviada', async () => {
    await loginAs('avaliador@exemplo.com');
    renderAt('/avaliador/avaliacoes/40');

    expect(await screen.findByText('Esta avaliação ainda não foi enviada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar avaliação' })).toHaveAttribute(
      'href',
      '/avaliador/projetos/40/avaliar',
    );
  });
});
