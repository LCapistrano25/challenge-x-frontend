import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { HelpCenterPage } from './HelpCenterPage';

function HeaderProbe({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PageHeaderContent | null>(null);
  return (
    <PageHeaderSetterContext.Provider value={setContent}>
      <PageHeaderContentContext.Provider value={content}>
        {content && <h1>{content.title}</h1>}
        {content?.subtitle && <p>{content.subtitle}</p>}
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
      <MemoryRouter initialEntries={['/academico/duvidas']}>
        <HeaderProbe>
          <HelpCenterPage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HelpCenterPage', () => {
  it('mostra o FAQ por assunto, o atendimento e as dicas como no Figma', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Dúvidas / Central de ajuda' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeInTheDocument();
    expect(screen.getByText('8 respostas · 2 assuntos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Equipe e liderança' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projeto e entregas' })).toBeInTheDocument();
    expect(screen.getAllByText('4 perguntas e respostas')).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(8);

    expect(screen.getByRole('heading', { name: 'Ainda precisa de ajuda?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Falar com a organização' })).toBeInTheDocument();
    expect(screen.getByText('Informe a equipe ou o projeto.')).toBeInTheDocument();
    expect(screen.getByText('Fique de olho no painel')).toBeInTheDocument();
  });

  it('filtra as perguntas por palavra-chave', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('searchbox', { name: 'Buscar dúvidas' }), 'liderança');
    expect(screen.getByText('2 respostas · 1 assunto')).toBeInTheDocument();
    expect(screen.getByText('2 perguntas e respostas')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Quando posso solicitar a liderança?' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Projeto e entregas' })).not.toBeInTheDocument();
  });

  it('avisa quando nada é encontrado e permite limpar a busca', async () => {
    const user = userEvent.setup();
    renderPage();

    const search = screen.getByRole('searchbox', { name: 'Buscar dúvidas' });
    await user.type(search, 'certificado');
    expect(screen.getByText('Nenhuma resposta encontrada')).toBeInTheDocument();
    expect(screen.getByText('0 respostas · 0 assuntos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(search).toHaveValue('');
    expect(screen.getByText('8 respostas · 2 assuntos')).toBeInTheDocument();
  });

  it('abre um chamado em "Falar com a organização"', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Falar com a organização' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Enviar mensagem' }));
    expect(dialog.getByText('Informe o assunto.')).toBeInTheDocument();
    expect(dialog.getByText('Descreva sua dúvida.')).toBeInTheDocument();

    await user.type(dialog.getByLabelText('Assunto *'), 'Prazo da etapa 2');
    await user.type(dialog.getByLabelText('Mensagem *'), 'Até quando posso reenviar a entrega?');
    await user.click(dialog.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
