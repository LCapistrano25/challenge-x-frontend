import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as mswHttp, HttpResponse } from 'msw';
import { useState, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { buildDeliverables } from '@/mocks/fixtures/deliverables';
import { http } from '@/shared/lib/http';
import {
  PageHeaderContentContext,
  PageHeaderSetterContext,
  type PageHeaderContent,
} from '@/shared/lib/page-header';
import type { CanvasContent, DeliverableVersion, SwotContent } from '@/features/projects';
import { CANVAS_BLOCKS, SWOT_QUADRANTS } from '../lib/submission';
import { DeliveryConfirmationPage } from './DeliveryConfirmationPage';
import { SubmitDeliveryPage } from './SubmitDeliveryPage';

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

function renderAt(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <HeaderProbe>
          <Routes>
            <Route path="/academico/projeto" element={<p>Tela do projeto</p>} />
            <Route path="/academico/projeto/entrega" element={<SubmitDeliveryPage />} />
            <Route
              path="/academico/projeto/entrega/confirmacao"
              element={<DeliveryConfirmationPage />}
            />
          </Routes>
        </HeaderProbe>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const MB = 1024 * 1024;
/** Arquivo com o tamanho informado (só para validação local; não é enviado). */
const fileOf = (name: string, size: number, type = 'application/pdf') => {
  const file = new File(['conteúdo'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

/** Arquivo real (o conteúdo vai no multipart e o mock mede o tamanho). */
const realFileOf = (name: string, size: number) =>
  new File([new Uint8Array(Math.round(size))], name, { type: 'application/pdf' });

describe('SubmitDeliveryPage', () => {
  beforeEach(() =>
    http.post('/api/auth/sessions/password', {
      email: 'lider.projeto@exemplo.com',
      password: '123456',
    }),
  );

  it('mostra a etapa, as orientações e valida os campos obrigatórios', async () => {
    const user = userEvent.setup();
    renderAt('/academico/projeto/entrega?etapa=23');

    expect(screen.getByRole('heading', { level: 1, name: 'Enviar entrega' })).toBeInTheDocument();
    expect(
      await screen.findByText('Etapa 3 de 4 · AgroConecta — da horta à comunidade · Conexão Verde'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projeto da equipe' })).toBeInTheDocument();
    expect(screen.getByText('O que entregar nesta etapa')).toBeInTheDocument();
    expect(screen.getByText('PDF ou ZIP, até 20 MB.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar entrega' }));
    expect(await screen.findByText('Selecione o arquivo da entrega.')).toBeInTheDocument();
    expect(screen.getByText('Informe o link do protótipo.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Link do protótipo'), 'http://agroconecta.app');
    await user.click(screen.getByRole('button', { name: 'Enviar entrega' }));
    expect(
      await screen.findByText('Informe um endereço completo, começando com https://.'),
    ).toBeInTheDocument();
  });

  it('recusa formato e tamanho fora do permitido', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderAt('/academico/projeto/entrega?etapa=23');

    const input = await screen.findByLabelText('Material da entrega *');
    await user.upload(input, fileOf('apresentacao.pptx', MB, 'application/octet-stream'));
    expect(
      await screen.findByText('Formato não aceito. Envie um arquivo PDF ou ZIP.'),
    ).toBeInTheDocument();

    await user.upload(input, fileOf('prototipo.zip', 25 * MB, 'application/zip'));
    expect(await screen.findByText('O arquivo tem 25,0 MB. O limite é 20 MB.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument();
  });

  it('envia a entrega e mostra a confirmação aguardando avaliação', async () => {
    const user = userEvent.setup();
    renderAt('/academico/projeto/entrega?etapa=23');

    await user.upload(
      await screen.findByLabelText('Material da entrega *'),
      realFileOf('prototipo_validacao_agroconecta_v1.pdf', 4.8 * MB),
    );
    expect(screen.getByText('4,8 MB · PDF · Pronto para enviar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Substituir arquivo' })).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Link do protótipo'),
      'https://agroconecta.netlify.app/prototipo',
    );
    await user.type(
      screen.getByLabelText('Observação (opcional)'),
      'O PDF reúne o link do protótipo e os resultados dos testes.',
    );
    await user.click(screen.getByRole('button', { name: 'Enviar entrega' }));

    expect(
      await screen.findByRole('heading', { name: 'Entrega da etapa realizada!' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entrega realizada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aguardando avaliação')).toBeInTheDocument();
    expect(screen.getByText('prototipo_validacao_agroconecta_v1.pdf')).toBeInTheDocument();
    expect(screen.getByText('4,8 MB · PDF · Versão 1')).toBeInTheDocument();
    expect(screen.getByText('Ana Maria · Líder da equipe')).toBeInTheDocument();
    expect(screen.getByText('https://agroconecta.netlify.app/prototipo')).toBeInTheDocument();
    expect(
      screen.getByText('O PDF reúne o link do protótipo e os resultados dos testes.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Apresentação final')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao projeto' })).toBeInTheDocument();
  });

  it('bloqueia etapas futuras e informa a data de abertura', async () => {
    renderAt('/academico/projeto/entrega?etapa=24');

    expect(await screen.findByText('Esta etapa ainda não está aberta')).toBeInTheDocument();
    expect(
      screen.getByText(/^O envio fica disponível a partir de \d{2}\/\d{2}\/\d{4}, às 00:00/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar entrega' })).not.toBeInTheDocument();
  });

  it('permite o reenvio quando a orientação pediu ajustes', async () => {
    renderAt('/academico/projeto/entrega?etapa=22');

    expect(await screen.findByRole('button', { name: 'Enviar nova versão' })).toBeInTheDocument();
    expect(screen.getByText(/a nova versão substitui a anterior na avaliação/)).toBeInTheDocument();
  });

  it('participante também envia (só a liderança edita o projeto)', async () => {
    await http.post('/api/auth/sessions/password', {
      email: 'integrante.projeto@exemplo.com',
      password: '123456',
    });
    renderAt('/academico/projeto/entrega?etapa=23');

    expect(await screen.findByRole('button', { name: 'Enviar entrega' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar projeto' })).not.toBeInTheDocument();
  });

  it('envia campos CANVAS e SWOT como JSON quando nao ha arquivos', async () => {
    const user = userEvent.setup({ delay: null });
    let stages = buildDeliverables({ seeded: true }).map((entry) =>
      entry.stage.id === 23
        ? {
            ...entry,
            fields: [
              {
                id: 901,
                type: 'CANVAS' as const,
                label: 'Business Model Canvas',
                required: true,
                formats: null,
                max_size_mb: null,
              },
              {
                id: 902,
                type: 'SWOT' as const,
                label: 'Matriz SWOT',
                required: true,
                formats: null,
                max_size_mb: null,
              },
            ],
          }
        : entry,
    );

    let capturedContentType = '';
    let capturedBody: unknown = null;

    server.use(
      mswHttp.get('*/api/projects/:projectId/deliverables', () => HttpResponse.json(stages)),
      mswHttp.post('*/api/projects/:projectId/stages/:stageId/versions', async ({ request }) => {
        capturedContentType = request.headers.get('content-type') ?? '';
        const payload = (await request.json()) as {
          items: Array<{ field_id: number; content?: CanvasContent | SwotContent }>;
        };
        capturedBody = payload;
        const created: DeliverableVersion = {
          id: 999,
          version_number: 1,
          submitted_at: new Date().toISOString(),
          submitted_by: { user_id: '1', name: 'Ana Maria' },
          notes: null,
          items: [
            {
              id: 1,
              field_id: 901,
              type: 'CANVAS',
              link: null,
              file_url: null,
              file_name: null,
              size_bytes: null,
              content: (payload.items[0]?.content ?? null) as CanvasContent | null,
            },
            {
              id: 2,
              field_id: 902,
              type: 'SWOT',
              link: null,
              file_url: null,
              file_name: null,
              size_bytes: null,
              content: (payload.items[1]?.content ?? null) as SwotContent | null,
            },
          ],
          receipt: null,
        };
        stages = stages.map((entry) =>
          entry.stage.id === 23
            ? { ...entry, status: 'SUBMITTED' as const, versions: [created, ...entry.versions] }
            : entry,
        );
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    renderAt('/academico/projeto/entrega?etapa=23');

    await screen.findByText('Business Model Canvas');
    for (const block of CANVAS_BLOCKS) {
      await user.type(screen.getByLabelText(block.label), `Valor ${block.key}`);
    }
    for (const quadrant of SWOT_QUADRANTS) {
      await user.type(screen.getByLabelText(`${quadrant.label} — item 1`), `Item ${quadrant.key}`);
    }

    await user.click(screen.getByRole('button', { name: 'Enviar entrega' }));

    expect(
      await screen.findByRole('heading', { name: 'Entrega da etapa realizada!' }),
    ).toBeInTheDocument();
    expect(capturedContentType).toContain('application/json');
    expect(capturedBody).toMatchObject({
      items: [
        {
          field_id: 901,
          content: {
            customer_segments: 'Valor customer_segments',
            cost_structure: 'Valor cost_structure',
          },
        },
        {
          field_id: 902,
          content: {
            strengths: ['Item strengths'],
            threats: ['Item threats'],
          },
        },
      ],
    });
  });
});
