import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectDetailPage } from './ProjectDetailPage';

function renderPage(path = '/projetos/40') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/projetos/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projetos" element={<h1>Vitrine</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectDetailPage — tela compartilhada', () => {
  it('mostra o resumo, os integrantes, as informações e as entregas', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Inclusão Digital no Campo' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Resumo Expandido')).toBeInTheDocument();

    const members = within(screen.getByRole('region', { name: 'Resumo e integrantes' }));
    expect(members.getByText('Gabriel Gomes')).toBeInTheDocument();
    expect(members.getByText('Líder')).toBeInTheDocument();

    const info = within(screen.getByRole('region', { name: 'Informações do projeto' }));
    expect(info.getByText('Engenharia de Software')).toBeInTheDocument();
    expect(info.getByText('10 - Redução das Desigualdades')).toBeInTheDocument();
    expect(info.getByRole('link', { name: 'Voltar para Vitrine' })).toHaveAttribute(
      'href',
      '/projetos',
    );

    const deliveries = within(screen.getByRole('region', { name: 'Entregas do projeto' }));
    expect(deliveries.getByText('Resumo.pdf')).toBeInTheDocument();
    expect(deliveries.getByText('Link do projeto')).toBeInTheDocument();
  });

  it('volta para a avaliação quando vem do professor (?from=)', async () => {
    renderPage('/projetos/501?from=%2Fprofessor%2Fentregas%2Fd1');

    const info = within(await screen.findByRole('region', { name: 'Informações do projeto' }));
    expect(info.getByRole('link', { name: 'Voltar para a avaliação' })).toHaveAttribute(
      'href',
      '/professor/entregas/d1',
    );
    expect(info.getByRole('link', { name: 'Ver todos os projetos' })).toHaveAttribute(
      'href',
      '/projetos',
    );
  });

  it('mostra erro quando o projeto não existe', async () => {
    renderPage('/projetos/999');

    expect(await screen.findByText('Projeto não encontrado')).toBeInTheDocument();
  });
});
