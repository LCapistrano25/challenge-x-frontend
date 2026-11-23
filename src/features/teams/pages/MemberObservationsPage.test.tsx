import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { simulateMicrosoftLogin } from '@/features/auth';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { MemberObservationsPage } from './MemberObservationsPage';

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
      <MemoryRouter initialEntries={['/professor/integrantes']}>
        <HeaderProbe>
          <MemberObservationsPage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const note = () => within(screen.getByRole('region', { name: 'Observação confidencial' }));

describe('MemberObservationsPage — professor', () => {
  beforeEach(async () => {
    await simulateMicrosoftLogin('professor@exemplo.com');
  });

  it('mostra o aviso de confidencialidade e o registro completo', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Observações sobre Integrantes' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Confidencial • Acesso exclusivo ao docente responsável pelo curso.'),
    ).toBeInTheDocument();

    // Abre na primeira equipe (Aurora) e no primeiro registro (Lucas Matos).
    const list = within(screen.getByRole('region', { name: 'Observações registradas' }));
    expect(await list.findByText('Mariana Costa')).toBeInTheDocument();

    expect(note().getByText('Somente leitura')).toBeInTheDocument();
    expect(note().getByText('Registro do líder')).toBeInTheDocument();
    expect(note().getByText(/Registrado por: Ana Souza/)).toBeInTheDocument();
    expect(note().getByText(/Lucas organizou o cronograma/)).toBeInTheDocument();
  });

  it('troca de equipe pelo seletor e mostra o estado vazio', async () => {
    renderPage();

    await screen.findByRole('region', { name: 'Observações registradas' });
    await userEvent.selectOptions(screen.getByLabelText('Equipe'), 'Equipe Nexo (DXN3P9)');

    expect(await screen.findByText('Sem avaliações registradas')).toBeInTheDocument();
  });
});
