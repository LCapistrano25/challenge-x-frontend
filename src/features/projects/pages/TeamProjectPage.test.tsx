import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import { TeamProjectPage } from './TeamProjectPage';

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

async function signIn(email: string) {
  await http.post('/auth/login', { email, password: '123456' });
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/academico/projeto']}>
        <HeaderProbe>
          <Routes>
            <Route path="/academico/projeto" element={<TeamProjectPage />} />
            <Route path="/academico/projeto/novo" element={<p>Cadastro do projeto</p>} />
          </Routes>
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const stageRow = (name: string) => within(screen.getByRole('listitem', { name }));

describe('TeamProjectPage — líder', () => {
  beforeEach(() => signIn('lider.projeto@exemplo.com'));

  it('mostra o resumo do projeto e os indicadores como no Figma', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Projeto da equipe' }),
    ).toBeInTheDocument();
    expect(
      await screen.findAllByRole('heading', { name: 'AgroConecta — da horta à comunidade' }),
    ).toHaveLength(2);
    expect(screen.getByText('ODS 11')).toBeInTheDocument();
    expect(screen.getByText('Cadastrado')).toBeInTheDocument();
    expect(screen.getByText('Conexão Verde · 4 integrantes')).toBeInTheDocument();
    expect(
      screen.getByText('Líder: Ana Maria · Orientadora: Profa. Carla Mendes'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tecnologia e sustentabilidade')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar projeto' })).toHaveAttribute(
      'href',
      '/academico/projeto/novo?editar=1',
    );

    expect(await screen.findByText('1 de 4')).toBeInTheDocument();
    expect(screen.getByText('entregas aprovadas')).toBeInTheDocument();
    expect(screen.getByText('1 ajuste')).toBeInTheDocument();
    expect(screen.getByText(/^aguardando reenvio até \d{2}\/\d{2}$/)).toBeInTheDocument();
    expect(screen.getByText(/^Última edição por Ana Maria|Cadastro em/)).toBeInTheDocument();
  });

  it('lista as etapas com status, versões, reenvio e etapas futuras bloqueadas', async () => {
    renderPage();

    const research = stageRow(
      await screen.findByText('Pesquisa e diagnóstico').then(() => 'Pesquisa e diagnóstico'),
    );
    expect(research.getByText('Aprovada')).toBeInTheDocument();
    expect(research.getByText('diagnostico_agroconecta_v1.pdf · 2,4 MB')).toBeInTheDocument();
    expect(research.getByText(/Enviado por Ana Maria em .* · Versão 1/)).toBeInTheDocument();
    expect(
      research.getByRole('button', { name: 'Consultar envio: Pesquisa e diagnóstico' }),
    ).toBeInTheDocument();

    const proposal = stageRow('Proposta de solução');
    expect(proposal.getByText('Ajustes solicitados')).toBeInTheDocument();
    expect(proposal.getByText('Atenção ao reenvio')).toBeInTheDocument();
    expect(
      proposal.getByText(/detalhar os indicadores de impacto\. Reenvio autorizado até/),
    ).toBeInTheDocument();
    expect(
      proposal.getByRole('link', { name: 'Atualizar entrega: Proposta de solução' }),
    ).toHaveAttribute('href', '/academico/projeto/entrega?etapa=22');

    const prototype = stageRow('Protótipo e validação');
    expect(prototype.getByText('Em andamento')).toBeInTheDocument();
    expect(prototype.getByText('Nenhum arquivo enviado')).toBeInTheDocument();
    expect(
      prototype.getByText('Envio aberto · PDF ou ZIP, até 20 MB · Link do protótipo obrigatório'),
    ).toBeInTheDocument();
    expect(
      prototype.getByRole('link', { name: 'Enviar entrega: Protótipo e validação' }),
    ).toBeInTheDocument();

    const final = stageRow('Apresentação final');
    expect(final.getByText('Em breve')).toBeInTheDocument();
    expect(final.getByText('Aguardando abertura da etapa')).toBeInTheDocument();
    expect(
      final.getByText(/^Envio disponível a partir de \d{2}\/\d{2}\/\d{4}/),
    ).toBeInTheDocument();
    expect(final.queryByRole('link', { name: /Enviar entrega/ })).not.toBeInTheDocument();

    expect(screen.getByText('2 ações pendentes da equipe')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cronograma da edição' })).toBeInTheDocument();
  });

  it('mostra o histórico de versões em "Ver detalhes"', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Ver detalhes: Proposta de solução' }),
    );
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading', { name: 'Histórico de versões' })).toBeInTheDocument();
    expect(dialog.getByText('Versão 2')).toBeInTheDocument();
    expect(dialog.getByText('Versão 1')).toBeInTheDocument();
    expect(dialog.getByText(/Enviada por João Silva/)).toBeInTheDocument();
  });
});

describe('TeamProjectPage — participante', () => {
  it('pode enviar entregas, mas não edita os dados cadastrais', async () => {
    await signIn('integrante.projeto@exemplo.com');
    renderPage();

    expect(
      await screen.findByRole('link', { name: 'Enviar entrega: Protótipo e validação' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar projeto' })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Integrantes podem enviar arquivos. Apenas a liderança pode editar os dados cadastrais do projeto.',
      ),
    ).toBeInTheDocument();
  });
});

describe('TeamProjectPage — sem projeto', () => {
  it('leva o líder ao cadastro do projeto', async () => {
    renderPage();
    expect(await screen.findByText('Cadastro do projeto')).toBeInTheDocument();
  });

  it('avisa o participante que o projeto ainda não foi cadastrado', async () => {
    await signIn('participante@exemplo.com');
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'O projeto da equipe ainda não foi cadastrado' }),
    ).toBeInTheDocument();
  });
});
