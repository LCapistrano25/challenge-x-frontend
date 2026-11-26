import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { publicProjects } from '@/mocks/fixtures/academic-home';
import { server } from '@/mocks/server';
import { ProjectShowcasePage } from './ProjectShowcasePage';

function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HeaderProbe>
          <ProjectShowcasePage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectShowcasePage — vitrine compartilhada', () => {
  it('lista os projetos com link para o detalhe', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Vitrine de Projetos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Inclusão Digital no Campo/ })).toHaveAttribute(
      'href',
      '/projetos/40',
    );
    expect(screen.getByRole('link', { name: /Mente Saudável/ })).toBeInTheDocument();
  });

  it('filtra por curso', async () => {
    // As opções do filtro vêm de GET /api/courses; aqui usamos os cursos dos projetos públicos.
    const courses = [...new Map(publicProjects.map((p) => [p.course.id, p.course])).values()];
    server.use(http.get('*/api/courses', () => HttpResponse.json(courses)));
    renderPage();

    await screen.findByRole('heading', { name: 'Vitrine de Projetos' });
    await userEvent.selectOptions(screen.getByLabelText('Curso'), 'Psicologia');

    expect(screen.getByRole('link', { name: /Mente Saudável/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Inclusão Digital no Campo/ }),
    ).not.toBeInTheDocument();
  });

  it('mostra o estado vazio quando a busca não retorna nada', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Vitrine de Projetos' });
    await userEvent.type(screen.getByLabelText('Buscar projeto'), 'zzz-nao-existe');

    expect(await screen.findByText('Nenhum projeto encontrado')).toBeInTheDocument();
  });
});
