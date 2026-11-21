import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { CoursesTeachersPage } from './CoursesTeachersPage';

function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {content && <h1>{content.title}</h1>}
        {children}
      </PageHeaderContentContext.Provider>
    </PageHeaderSetterContext.Provider>
  );
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <HeaderProbe>
        <CoursesTeachersPage />
      </HeaderProbe>
    </QueryClientProvider>,
  );
}

describe('CoursesTeachersPage — domínios institucionais', () => {
  beforeEach(() =>
    http.post('/api/auth/sessions/password', {
      email: 'admin@exemplo.com',
      password: '123456',
    }),
  );

  it('lista, cria, trata duplicado e alterna status via PATCH', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cursos, professores e domínios' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('alunos.universidade.edu.br')).toBeInTheDocument();
    expect(screen.getByText('docentes.universidade.edu.br')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Domínio institucional *'), '@nova.edu.br');
    await user.selectOptions(screen.getByLabelText('Papel *'), 'TEACHER');
    await user.click(screen.getByRole('button', { name: 'Adicionar domínio' }));

    expect(await screen.findByText('nova.edu.br')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Domínio institucional *'), 'nova.edu.br');
    await user.click(screen.getByRole('button', { name: 'Adicionar domínio' }));
    expect(
      await screen.findByText('Este domínio já está cadastrado para o papel informado.'),
    ).toBeInTheDocument();

    const row = within(screen.getByText('nova.edu.br').closest('tr')!);
    expect(row.getByText('Ativo')).toBeInTheDocument();
    await user.click(row.getByRole('button', { name: 'Desativar' }));
    await waitFor(() => expect(row.getByText('Inativo')).toBeInTheDocument());
  });
});
