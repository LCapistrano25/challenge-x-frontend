import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http } from '@/shared/lib/http';
import { FinalistProjectDetailPage } from './FinalistProjectDetailPage';
import { FinalistProjectsPage } from './FinalistProjectsPage';

async function loginAs(email: string) {
  await http.post('/api/auth/sessions/password', { email, password: '123456' });
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/avaliador" element={<FinalistProjectsPage />} />
          <Route path="/avaliador/projetos/:projectId" element={<FinalistProjectDetailPage />} />
          <Route path="/avaliador/projetos/:projectId/avaliar" element={<p>Formulário</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Linhas da tabela (desktop): o cartão do celular repete o conteúdo para outra largura. */
const rowOf = (title: string) =>
  screen.getByRole('link', { name: new RegExp(`: ${title}$`) }).closest('li')!;

describe('FinalistProjectsPage', () => {
  beforeEach(() => loginAs('avaliador@exemplo.com'));

  it('lista só os projetos da banca, com contadores, prazo, nota e ação por status', async () => {
    renderAt('/avaliador');

    expect(
      await screen.findByRole('heading', { name: 'Projetos atribuídos à sua banca' }),
    ).toBeInTheDocument();
    expect(screen.getByText('6 atribuídos')).toBeInTheDocument();
    expect(screen.getByText('4 pendentes')).toBeInTheDocument();
    expect(screen.getByText('2 enviadas')).toBeInTheDocument();

    const portal = within(rowOf('Portal de Extensão'));
    expect(portal.getAllByText('Em preenchimento')[0]).toBeInTheDocument();
    expect(portal.getByText('23/10/2026')).toBeInTheDocument();
    expect(portal.getByText('Até 23h59')).toBeInTheDocument();
    expect(portal.getByRole('link', { name: /Continuar avaliação: Portal/ })).toHaveAttribute(
      'href',
      '/avaliador/projetos/40/avaliar',
    );

    const library = within(rowOf('Biblioteca Conectada'));
    expect(library.getByRole('link', { name: /Ver projeto: Biblioteca/ })).toHaveAttribute(
      'href',
      '/avaliador/projetos/41',
    );

    const labs = within(rowOf('Gestão de Laboratórios'));
    expect(labs.getByText('86 / 100')).toBeInTheDocument();
    expect(labs.getByText('Somente leitura')).toBeInTheDocument();
    expect(labs.getByRole('link', { name: /Ver avaliação: Gestão/ })).toBeInTheDocument();

    expect(
      screen.getByText('Exibindo 6 de 6 projetos · Não avaliados primeiro'),
    ).toBeInTheDocument();
  });

  it('busca e filtra por status; sem resultado, mostra o estado vazio e limpa os filtros', async () => {
    renderAt('/avaliador');
    const search = await screen.findByLabelText('Buscar projeto ou equipe');

    await userEvent.type(search, 'nexo');
    expect(
      screen.getByText('Exibindo 1 de 6 projetos · Não avaliados primeiro · Filtros aplicados'),
    ).toBeInTheDocument();
    expect(rowOf('Biblioteca Conectada')).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.selectOptions(screen.getByLabelText('Status da avaliação'), 'FINALIZED');
    expect(screen.getByText(/Exibindo 2 de 6 projetos/)).toBeInTheDocument();

    await userEvent.type(search, 'Energia solar');
    expect(screen.getByRole('heading', { name: 'Nenhum projeto encontrado' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Não encontramos projetos atribuídos com “Energia solar” e status Enviada. Tente outro termo ou remova os filtros.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca e filtros' }));
    expect(search).toHaveValue('');
    expect(screen.getByText(/Exibindo 6 de 6 projetos/)).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há projetos atribuídos', async () => {
    await loginAs('avaliador.sem-banca@exemplo.com');
    renderAt('/avaliador');

    expect(
      await screen.findByRole('heading', { name: 'Nenhum projeto atribuído no momento' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Buscar projeto ou equipe')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });
});

describe('FinalistProjectDetailPage', () => {
  beforeEach(() => loginAs('avaliador@exemplo.com'));

  it('mostra o projeto, os integrantes, as informações acadêmicas e os arquivos', async () => {
    renderAt('/avaliador/projetos/40');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Portal de Extensão' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Equipe Aurora · Projeto DX-2026-014 · Etapa final'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar avaliação' })).toHaveAttribute(
      'href',
      '/avaliador/projetos/40/avaliar',
    );
    expect(screen.getByRole('heading', { name: 'Objetivo e resultados' })).toBeInTheDocument();
    expect(
      screen.getByText('Engenharia de Software · Líder · Pesquisa e experiência do usuário'),
    ).toBeInTheDocument();
    expect(screen.getByText('ODS 10')).toBeInTheDocument();
    expect(screen.getByText('Prof.ª Juliana Ribeiro')).toBeInTheDocument();

    const report = screen.getByRole('link', {
      name: /Baixar Relatório final\.pdf \(PDF · 2,4 MB\)/,
    });
    expect(report).toHaveAttribute('href', '/mock/finalistas/40/relatorio-final.pdf');
    expect(report).toHaveAttribute('target', '_blank');
    const prototype = screen.getByRole('link', { name: /Abrir Protótipo navegável/ });
    expect(prototype).toHaveAttribute('href', 'https://www.figma.com/');
    expect(prototype).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Enviado em 20/10/2026 às 14h32')).toBeInTheDocument();
  });

  it('avisa quando o projeto não pertence à banca', async () => {
    renderAt('/avaliador/projetos/999');

    expect(await screen.findByText('Projeto não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Voltar aos projetos finalistas' })).toHaveAttribute(
      'href',
      '/avaliador',
    );
  });
});
