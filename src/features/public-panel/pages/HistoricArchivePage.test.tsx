import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { HistoricArchivePage } from './HistoricArchivePage';

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
          <HistoricArchivePage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HistoricArchivePage — acervo e galeria de vencedores (RF46)', () => {
  it('abre na aba Vencedores com o pódio de cada edição e a vigente "em breve"', async () => {
    renderPage();

    // Edição vigente aparece como "em breve".
    expect(await screen.findByText('Em breve')).toBeInTheDocument();

    // Pódio da edição encerrada mais recente.
    const podium = within(
      await screen.findByRole('region', { name: 'Vencedores de Desafio X 2025/2' }),
    );
    expect(podium.getByText('Grande Vencedor')).toBeInTheDocument();
    expect(podium.getByText('EcoRota Universitária')).toBeInTheDocument();

    // Há pódios de mais de uma edição passada.
    expect(
      screen.getByRole('region', { name: 'Vencedores de Desafio X 2024/2' }),
    ).toBeInTheDocument();
  });

  it('na aba Projetos passados, o link preserva o contexto (?from=/acervo)', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Projetos passados' }));

    const section = within(await screen.findByRole('region', { name: 'Projetos passados' }));
    expect(section.getByRole('link', { name: /EcoRota Universitária/ })).toHaveAttribute(
      'href',
      '/projetos/600?from=/acervo',
    );
  });

  it('troca a edição na aba Projetos passados', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Projetos passados' }));
    await screen.findByRole('link', { name: /EcoRota Universitária/ });
    await userEvent.selectOptions(screen.getByLabelText('Edição'), 'Desafio X 2024/2');

    expect(await screen.findByRole('link', { name: /Energia na Escola/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /EcoRota Universitária/ })).not.toBeInTheDocument();
  });
});
