import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { simulateMicrosoftLogin } from '@/features/auth';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { LeadershipApprovalPage } from './LeadershipApprovalPage';

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
      <MemoryRouter initialEntries={['/professor/lideranca']}>
        <HeaderProbe>
          <LeadershipApprovalPage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const detail = () => within(screen.getByRole('region', { name: 'Detalhe da solicitação' }));

describe('LeadershipApprovalPage — professor', () => {
  beforeEach(async () => {
    await simulateMicrosoftLogin('professor@exemplo.com');
  });

  it('mostra o aviso, a lista de pendentes e o detalhe da solicitação', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Aprovação de Liderança' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('3 solicitações pendentes de decisão nos cursos vinculados.'),
    ).toBeInTheDocument();

    const list = within(screen.getByRole('region', { name: 'Solicitações pendentes' }));
    expect(list.getByText('Solicitante: Lucas Matos')).toBeInTheDocument();
    expect(list.getByText('Solicitante: João Almeida')).toBeInTheDocument();

    expect(detail().getByText('Equipe Aurora • Portal de Extensão')).toBeInTheDocument();
    expect(detail().getByText('Justificativa do solicitante')).toBeInTheDocument();
  });

  it('aprova uma solicitação e mostra o resultado', async () => {
    renderPage();

    await screen.findByRole('region', { name: 'Detalhe da solicitação' });
    await userEvent.click(detail().getByRole('button', { name: 'Aprovar liderança' }));

    const dialog = within(screen.getByRole('dialog'));
    await userEvent.type(
      dialog.getByLabelText('Justificativa da decisão'),
      'Integrante ativo e com participação regular.',
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Confirmar aprovação' }));

    expect(await screen.findByText(/Liderança aprovada com sucesso\./)).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Resultado da solicitação' })).getByText(
        'Novo líder',
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Exibindo 2 de 2 solicitações pendentes')).toBeInTheDocument(),
    );
  });
});
