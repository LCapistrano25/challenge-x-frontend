import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Button, ButtonLink, Select, Spinner, TextField } from '@/shared/ui';
import {
  EmptyCard,
  EvaluatorFooter,
  EvaluatorHeading,
  Notice,
  Pill,
} from '../components/EvaluatorBlocks';
import { IconInventory } from '../components/evaluator-icons';
import blocks from '../components/Evaluator.module.css';
import { useEvaluatorPage } from '../hooks/useEvaluatorPage';
import { useFinalists } from '../hooks/useFinalists';
import { FINALISTS_PATH, evaluationViewPath } from '../lib/evaluator-paths';
import { countFinalists, editionCode, formatDate, formatTime, formatTotal } from '../lib/finalists';
import {
  EVALUATOR_STAGES,
  editionOptions,
  filterSent,
  sentEvaluations,
} from '../lib/my-evaluations';
import type { FinalistRow } from '../types';
import styles from './MyEvaluationsPage.module.css';

/**
 * Histórico das avaliações enviadas, somente leitura (Figma: 06 - Avaliador › "Minhas
 * avaliações" e "Histórico vazio"). Usa a mesma listagem de finalistas, então os contadores de
 * enviadas e pendentes são sempre os mesmos da tela de projetos finalistas.
 */
export function MyEvaluationsPage() {
  const edition = useEvaluatorPage();
  const { data, isLoading, isError, refetch } = useFinalists();
  const [search, setSearch] = useState('');
  const [editionId, setEditionId] = useState<string | null>(null);
  const [stage, setStage] = useState(EVALUATOR_STAGES[0]!.value);

  const rows = useMemo(() => data?.results ?? [], [data]);
  const sent = useMemo(() => sentEvaluations(rows), [rows]);
  const editions = useMemo(() => editionOptions(sent), [sent]);
  // Por padrão, a edição mais recente (Figma: "2026.2").
  const selectedEdition = editionId ?? editions[0]?.value ?? '';
  const visible = filterSent(sent, { search, editionId: selectedEdition, stage });
  const counters = countFinalists(rows);

  const heading = (
    <EvaluatorHeading
      edition={edition}
      title="Minhas avaliações"
      description="Histórico individual de notas e pareceres enviados. Consulte os detalhes de cada avaliação."
    />
  );

  if (isLoading) {
    return (
      <div className={blocks.page}>
        {heading}
        <Spinner label="Carregando suas avaliações…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={blocks.page}>
        {heading}
        <Notice tone="danger" title="Não foi possível carregar suas avaliações">
          Verifique sua conexão e tente novamente.
        </Notice>
        <Button
          variant="secondary"
          size="large"
          className={styles.alignStart}
          onClick={() => void refetch()}
        >
          Tentar novamente
        </Button>
        <EvaluatorFooter edition={edition} />
      </div>
    );
  }

  if (sent.length === 0) {
    return (
      <div className={blocks.page}>
        {heading}
        <EmptyCard
          icon={<IconInventory size={32} />}
          title="Você ainda não enviou avaliações"
          description="Após confirmar o primeiro envio, sua avaliação aparecerá aqui para consulta. Acesse os projetos atribuídos para começar."
          action={
            <ButtonLink to={FINALISTS_PATH} size="large">
              Ver projetos finalistas
            </ButtonLink>
          }
        />
        <EvaluatorFooter edition={edition} />
      </div>
    );
  }

  const currentEdition = editions.find((option) => option.value === selectedEdition)?.label;

  return (
    <div className={blocks.page}>
      {heading}
      <Notice title="Avaliações enviadas são somente leitura">
        Este histórico reúne seus registros publicados. Não é possível alterar notas, comentários ou
        justificativas após o envio.
      </Notice>

      <div className={styles.stats}>
        <section className={blocks.card}>
          <h2>
            {counters.sent} {counters.sent === 1 ? 'avaliação enviada' : 'avaliações enviadas'}
          </h2>
          <p className={blocks.small}>
            Etapa final{currentEdition ? ` · Edição ${currentEdition}` : ''}
          </p>
        </section>
        <section className={blocks.card}>
          <h2>
            {counters.pending} {counters.pending === 1 ? 'projeto pendente' : 'projetos pendentes'}
          </h2>
          <p className={blocks.small}>
            {counters.pending === 0
              ? 'Todas as avaliações da sua banca foram enviadas.'
              : 'Continue a avaliação dos demais projetos na listagem de finalistas.'}
          </p>
        </section>
      </div>

      <section className={blocks.card} aria-label="Busca e filtros">
        <div className={styles.filters}>
          <TextField
            className={blocks.field}
            type="search"
            label="Buscar avaliação"
            placeholder="Projeto ou equipe..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            className={blocks.field}
            label="Edição"
            options={[...editions, { value: '', label: 'Todas as edições' }]}
            value={selectedEdition}
            onChange={(event) => setEditionId(event.target.value)}
          />
          <Select
            className={blocks.field}
            label="Etapa"
            options={EVALUATOR_STAGES}
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          />
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyCard
          icon={<IconInventory size={32} />}
          title="Nenhuma avaliação encontrada"
          description={`Não encontramos avaliações enviadas${search.trim() ? ` com “${search.trim()}”` : ' com esses filtros'}. Tente outro termo ou remova os filtros.`}
          action={
            <Button
              size="large"
              onClick={() => {
                setSearch('');
                setEditionId(null);
              }}
            >
              Limpar busca e filtros
            </Button>
          }
        />
      ) : (
        <section className={cn(blocks.card, styles.listCard)} aria-labelledby="sent-title">
          <h2 id="sent-title" className={styles.listTitle}>
            Avaliações enviadas
          </h2>
          <div className={styles.tableHead} aria-hidden="true">
            <span>Projeto / equipe</span>
            <span>Etapa</span>
            <span>Envio</span>
            <span>Pontuação</span>
            <span>Status</span>
          </div>
          <ul className={styles.list}>
            {visible.map((row) => (
              <SentItem key={row.project.id} row={row} />
            ))}
          </ul>
          <p className={blocks.small}>
            Exibindo {visible.length} de {sent.length}{' '}
            {sent.length === 1 ? 'avaliação' : 'avaliações'} · Mais recentes primeiro
          </p>
        </section>
      )}

      <ButtonLink
        to={FINALISTS_PATH}
        variant="secondary"
        size="large"
        className={styles.toFinalists}
      >
        Ir aos projetos finalistas
      </ButtonLink>
      <EvaluatorFooter edition={edition} />
    </div>
  );
}

function SentItem({ row }: { row: FinalistRow }) {
  const { project, team } = row;
  const stage = `Final · ${editionCode(project.edition)}`;
  const sentAt = row.finalized_at
    ? `${formatDate(row.finalized_at)} · ${formatTime(row.finalized_at)}`
    : '—';
  const total = formatTotal(row.my_total_score, row.max_total_score);
  const to = evaluationViewPath(project.id);

  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <div className={styles.cell}>
          <span className={blocks.strong}>{project.title}</span>
          <span>{team.name}</span>
        </div>
        <span className={styles.cell}>{stage}</span>
        <span className={styles.cell}>{sentAt}</span>
        <span className={styles.score}>{total}</span>
        <div className={styles.statusCell}>
          <Pill tone="sent">Enviada</Pill>
          <Link to={to} className={styles.action} aria-label={`Ver avaliação: ${project.title}`}>
            Ver avaliação →
          </Link>
        </div>
      </div>

      <article className={styles.mobileCard} aria-label={project.title}>
        <Pill tone="sent">Enviada</Pill>
        <h3>{project.title}</h3>
        <p>
          {team.name} · {stage}
        </p>
        <p>Enviada em {sentAt}</p>
        <p>Pontuação: {total}</p>
        <ButtonLink to={to} variant="secondary" size="large" className={styles.full}>
          Ver avaliação
        </ButtonLink>
      </article>
    </li>
  );
}
