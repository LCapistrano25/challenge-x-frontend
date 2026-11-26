import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { ProjectDetailPage } from './ProjectDetailPage';

function renderPage(path = '/projetos/40') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/projetos/:projectId" element={<ProjectDetailPage />} />
            <Route path="/projetos" element={<h1>Vitrine</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ProjectDetailPage — tela compartilhada', () => {
  it('mostra o sobre, os integrantes, as informações acadêmicas e os arquivos', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Inclusão Digital no Campo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sobre o projeto' })).toBeInTheDocument();
    expect(screen.getByText('Objetivo e resultados')).toBeInTheDocument();

    const members = within(screen.getByRole('region', { name: 'Integrantes da equipe' }));
    expect(members.getByText('Gabriel Gomes')).toBeInTheDocument();
    expect(members.getByText(/Líder/)).toBeInTheDocument();

    const info = within(screen.getByRole('region', { name: 'Informações acadêmicas' }));
    expect(info.getByText('Engenharia de Software')).toBeInTheDocument();
    expect(info.getByText('ODS 10')).toBeInTheDocument();
    expect(info.getByText('Redução das Desigualdades')).toBeInTheDocument();
    expect(info.getByText('React')).toBeInTheDocument();

    const files = within(screen.getByRole('region', { name: 'Arquivos entregues' }));
    expect(files.getByText('Relatório final.pdf')).toBeInTheDocument();
    expect(files.getByText('Protótipo navegável')).toBeInTheDocument();

    const canvas = within(screen.getByRole('region', { name: 'Business Model Canvas' }));
    expect(canvas.getByText('Proposta de valor')).toBeInTheDocument();
    expect(canvas.getByText('Parcerias-chave')).toBeInTheDocument();
    expect(canvas.getByText('Custos e sustentabilidade')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Voltar para a vitrine/ })).toHaveAttribute(
      'href',
      '/projetos',
    );
  });

  it('volta para a avaliação quando vem do professor (?from=)', async () => {
    renderPage('/projetos/501?from=%2Fprofessor%2Fentregas%2Fd1');

    expect(await screen.findByRole('link', { name: /Voltar para a avaliação/ })).toHaveAttribute(
      'href',
      '/professor/entregas/d1',
    );
  });

  it('volta para o acervo quando vem do acervo (?from=/acervo)', async () => {
    renderPage('/projetos/600?from=%2Facervo');

    expect(await screen.findByRole('link', { name: /Voltar para o acervo/ })).toHaveAttribute(
      'href',
      '/acervo',
    );
  });

  it('mostra erro quando o projeto não existe', async () => {
    renderPage('/projetos/999');

    expect(await screen.findByText('Projeto não encontrado')).toBeInTheDocument();
  });
});
