import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { MemberEvaluationPage } from './MemberEvaluationPage';

/** Faz o papel do cabeçalho do layout: mostra título e subtítulo definidos pela página. */
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
      <MemoryRouter initialEntries={['/academico/avaliacao-membro']}>
        <HeaderProbe>
          <MemberEvaluationPage />
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const memberButton = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^${name},`) });

async function rate(criterion: string, score: string) {
  const group = within(screen.getByRole('radiogroup', { name: criterion }));
  await userEvent.click(group.getByRole('radio', { name: score }));
}

describe('MemberEvaluationPage — líder', () => {
  it('lista os integrantes sem o próprio líder, com situação e progresso', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Avaliação de membro' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Avalie a participação dos integrantes da sua equipe.'),
    ).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Equipe Aurora' })).toBeInTheDocument();
    expect(
      screen.getByText('4 integrantes · 2 vagas disponíveis · Liderança: Ana Maria'),
    ).toBeInTheDocument();
    expect(screen.getByText('Você é líder')).toBeInTheDocument();
    expect(screen.getByText('Exclusivo da liderança')).toBeInTheDocument();

    expect(await screen.findByText('1 de 3 avaliações enviadas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ana Maria,/ })).not.toBeInTheDocument();
    expect(memberButton('João Silva')).toHaveAccessibleName('João Silva, Não iniciada');
    expect(memberButton('José Ferreira')).toHaveAccessibleName('José Ferreira, Enviada');
    expect(memberButton('José Pereira')).toHaveAccessibleName('José Pereira, Não iniciada');

    // Abre o primeiro integrante ainda não avaliado.
    expect(memberButton('João Silva')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'João Silva' })).toBeInTheDocument();
    expect(screen.getByText('Engenharia de Software · Participante')).toBeInTheDocument();
    expect(screen.getByText('Ainda não enviada')).toBeInTheDocument();
  });

  it('só habilita o envio com os 4 critérios e atualiza o contador', async () => {
    const user = userEvent.setup();
    renderPage();

    const send = await screen.findByRole('button', { name: 'Enviar avaliação' });
    expect(send).toBeDisabled();

    await rate('Comprometimento', '4 · Boa');
    expect(memberButton('João Silva')).toHaveAccessibleName('João Silva, Em preenchimento');
    await rate('Colaboração', '5 · Excelente');
    await rate('Comunicação', '4 · Boa');
    expect(send).toBeDisabled();
    expect(
      screen.getByText('3 de 4 critérios preenchidos · Avaliação de João Silva ainda não enviada.'),
    ).toBeInTheDocument();

    await rate('Contribuição para o projeto', '4 · Boa');
    expect(send).toBeEnabled();
    await user.type(
      screen.getByLabelText('Comentários sobre a participação'),
      'Participou das discussões.',
    );
    await user.click(send);

    expect(await screen.findByText('2 de 3 avaliações enviadas')).toBeInTheDocument();
    expect(memberButton('João Silva')).toHaveAccessibleName('João Silva, Enviada');
    // Segue para o próximo integrante pendente.
    await waitFor(() =>
      expect(memberButton('José Pereira')).toHaveAttribute('aria-pressed', 'true'),
    );
  });

  it('mostra a avaliação já enviada sem expor o conteúdo', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('1 de 3 avaliações enviadas');
    await user.click(memberButton('José Ferreira'));

    expect(screen.getByRole('heading', { level: 2, name: 'José Ferreira' })).toBeInTheDocument();
    expect(screen.getByText('Avaliação enviada em 10/11/2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Comprometimento: 5\/5/)).not.toBeInTheDocument();
  });

  it('guarda o rascunho de cada integrante ao trocar de seleção', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('button', { name: 'Enviar avaliação' });
    await rate('Comprometimento', '2 · Baixa');
    await user.click(memberButton('José Pereira'));
    expect(
      within(screen.getByRole('radiogroup', { name: 'Comprometimento' })).getByRole('radio', {
        name: '2 · Baixa',
      }),
    ).not.toBeChecked();

    await user.click(memberButton('João Silva'));
    expect(
      within(screen.getByRole('radiogroup', { name: 'Comprometimento' })).getByRole('radio', {
        name: '2 · Baixa',
      }),
    ).toBeChecked();
  });
});

describe('MemberEvaluationPage — participante', () => {
  it('não mostra o formulário para quem não é líder', async () => {
    await http.post('/auth/login', { email: 'participante@exemplo.com', password: '123456' });
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Avaliação exclusiva da liderança' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument();
  });
});
