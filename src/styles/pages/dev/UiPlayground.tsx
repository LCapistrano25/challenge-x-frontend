import { useState } from 'react';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DropdownMenu,
  Dropzone,
  EmptyState,
  IconCheckCircle,
  IconChevronDown,
  IconDownload,
  IconPlus,
  Input,
  Modal,
  notify,
  Pagination,
  ProgressBar,
  Select,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Tooltip,
} from '@/shared/ui';
import './UiPlayground.css';

export function UiPlayground() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(5);
  const [files, setFiles] = useState<File[]>([]);
  const [enabled, setEnabled] = useState(true);

  return (
    <main className="ui-playground">
      <header className="ui-playground__header">
        <p className="ui-playground__eyebrow">Design system</p>
        <h1>UI Playground</h1>
        <p className="ui-playground__intro">
          Catálogo interativo dos componentes disponíveis. Use os controles para validar estados,
          tamanhos e comportamentos.
        </p>
      </header>

      <section className="ui-playground__section" aria-labelledby="buttons-title">
        <h2 id="buttons-title">Button</h2>
        <h3>Variantes</h3>
        <div className="ui-playground__row">
          <Button variant="primary">Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Destrutivo</Button>
        </div>
        <h3>Tamanhos e estados</h3>
        <div className="ui-playground__row">
          <Button size="small">Pequeno</Button>
          <Button size="medium">Médio</Button>
          <Button size="large">Grande</Button>
          <Button disabled>Desabilitado</Button>
          <Button variant="danger" disabled>
            Desabilitado
          </Button>
          <Button onClick={() => notify.success('Ação concluída com sucesso.')}>Notificar</Button>
        </div>
      </section>

      <section className="ui-playground__section" aria-labelledby="fields-title">
        <h2 id="fields-title">Campos de formulário</h2>
        <div className="ui-playground__grid">
          <Input placeholder="Input padrão" aria-label="Input padrão" />
          <Input inputSize="small" placeholder="Input pequeno" aria-label="Input pequeno" />
          <Input inputSize="large" placeholder="Input grande" aria-label="Input grande" />
          <Input placeholder="Input inválido" invalid aria-label="Input inválido" />
          <Input placeholder="Input desabilitado" disabled aria-label="Input desabilitado" />
          <Select
            label="Select"
            placeholder="Escolha uma opção"
            options={[
              { value: 'design', label: 'Design' },
              { value: 'frontend', label: 'Front-end' },
              { value: 'backend', label: 'Back-end' },
            ]}
            hint="Selecione uma área de interesse."
          />
          <Select
            label="Select com erro"
            options={[{ value: 'incompleto', label: 'Valor incompleto' }]}
            error="Este campo é obrigatório."
          />
          <Textarea
            label="Textarea"
            placeholder="Escreva uma mensagem..."
            maxLength={140}
            hint="Compartilhe mais detalhes."
          />
          <Textarea
            label="Textarea com erro"
            defaultValue="Texto inválido"
            error="Revise o conteúdo informado."
          />
        </div>
        <div className="ui-playground__row ui-playground__controls">
          <Checkbox label="Aceito os termos de uso" defaultChecked />
          <Checkbox label="Checkbox com erro" error="Você precisa confirmar esta opção." />
          <Switch
            label={enabled ? 'Notificações ativas' : 'Notificações inativas'}
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </div>
      </section>

      <section className="ui-playground__section" aria-labelledby="feedback-title">
        <h2 id="feedback-title">Feedback e progresso</h2>
        <div className="ui-playground__stack">
          <Alert title="Informação" tone="info">
            Seu rascunho foi salvo automaticamente.
          </Alert>
          <Alert
            title="Sucesso"
            tone="success"
            action={
              <Button size="small" variant="secondary">
                Ver detalhes
              </Button>
            }
          >
            Convite enviado.
          </Alert>
          <Alert title="Atenção" tone="warning">
            Há campos pendentes neste formulário.
          </Alert>
          <Alert title="Erro" tone="danger">
            Não foi possível concluir a operação.
          </Alert>
          <div className="ui-playground__progress">
            <span>Progresso da atividade</span>
            <ProgressBar value={68} label="Progresso da atividade: 68%" />
          </div>
          <ProgressBar value={35} label="Progresso compacto: 35%" size="sm" />
        </div>
      </section>

      <section className="ui-playground__section" aria-labelledby="navigation-title">
        <h2 id="navigation-title">Navegação</h2>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Exemplo de abas">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="disabled" disabled>
              Desabilitada
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
          <TabsContent value="details">Conteúdo com informações detalhadas.</TabsContent>
        </Tabs>
        <div className="ui-playground__navigation-row">
          <Pagination page={page} pageCount={20} onPageChange={setPage} />
          <span className="ui-playground__caption">Página selecionada: {page}</span>
        </div>
        <Stepper
          steps={[
            { id: 'one', label: 'Inscrição', date: '15/05', status: 'done' },
            { id: 'two', label: 'Avaliação', date: '20/05', status: 'current', progress: 55 },
            { id: 'three', label: 'Resultado', date: '30/05', status: 'upcoming' },
          ]}
        />
        <Stepper
          variant="timeline"
          label="Cronograma (variante timeline)"
          steps={[
            { id: 't1', label: 'Inscrições', date: '04/10/2026', status: 'done' },
            { id: 't2', label: 'Formação das equipes', date: '24/10/2026', status: 'current' },
            { id: 't3', label: 'Avaliação técnica', date: '14/12/2026', status: 'upcoming' },
          ]}
        />
        <div className="ui-playground__row">
          <Badge tone="brand" shape="tag">
            Atualização
          </Badge>
          <Badge tone="success">Concluída</Badge>
          <Badge tone="progress">Em andamento</Badge>
          <Badge>Em breve</Badge>
          <Avatar name="Ana Maria" tone="pink" />
          <AvatarGroup names={['Gabriel Gomes', 'Maria Souza', 'Fernanda Silva', 'Lucas Lima']} />
        </div>
      </section>

      <section className="ui-playground__section" aria-labelledby="overlay-title">
        <h2 id="overlay-title">Overlays e ações</h2>
        <div className="ui-playground__row">
          <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Abrir confirmação
          </Button>
          <DropdownMenu
            trigger={
              <Button variant="secondary">
                <IconChevronDown size={18} /> Mais ações
              </Button>
            }
            items={[
              {
                label: 'Baixar relatório',
                icon: <IconDownload size={16} />,
                onSelect: () => notify.info('Download iniciado.'),
              },
              {
                label: 'Duplicar item',
                icon: <IconPlus size={16} />,
                onSelect: () => notify.success('Item duplicado.'),
              },
              {
                label: 'Excluir item',
                tone: 'danger',
                onSelect: () => notify.error('Item excluído.'),
              },
            ]}
          />
          <Tooltip content="A informação aparece ao passar o mouse ou focar no botão.">
            <Button variant="ghost" aria-label="Ajuda">
              ?
            </Button>
          </Tooltip>
        </div>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Modal de exemplo"
          description="Este modal demonstra foco, fechamento por Esc e sobreposição."
        >
          <p>O conteúdo do modal pode receber qualquer ReactNode.</p>
        </Modal>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Excluir item?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          tone="danger"
          onConfirm={() => {
            setConfirmOpen(false);
            notify.success('Item excluído.');
          }}
        />
      </section>

      <section className="ui-playground__section" aria-labelledby="data-title">
        <h2 id="data-title">Dados, arquivos e estados vazios</h2>
        <Table caption="Exemplo de tabela de participantes">
          <TableHead>
            <TableRow>
              <TableHeader onSort={() => notify.info('Ordenação por nome.')}>Nome</TableHeader>
              <TableHeader>Perfil</TableHeader>
              <TableHeader sorted="asc">Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Maria Silva</TableCell>
              <TableCell>Designer</TableCell>
              <TableCell>Ativo</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>João Santos</TableCell>
              <TableCell>Desenvolvedor</TableCell>
              <TableCell>Convidado</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Dropzone
          label="Anexos"
          files={files}
          onFilesChange={setFiles}
          accept=".pdf,.png"
          hint="PDF ou PNG até 10 MB."
          maxSizeMB={10}
        />
        <EmptyState
          icon={<IconCheckCircle size={32} />}
          title="Nenhum resultado encontrado"
          description="Tente ajustar os filtros para encontrar o que procura."
          action={<Button variant="secondary">Limpar filtros</Button>}
        />
      </section>
      <Toaster />
    </main>
  );
}
