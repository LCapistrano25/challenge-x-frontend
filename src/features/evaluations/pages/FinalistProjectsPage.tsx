import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiError } from '@/shared/lib/api-error';
import { cn } from '@/shared/lib/cn';
import { Button, ButtonLink, Select, Spinner, TextField } from '@/shared/ui';
import {
  EmptyCard,
  EvaluatorFooter,
  EvaluatorHeading,
  Notice,
  Pill,
  StatusPill,
} from '../components/EvaluatorBlocks';
import { IconAssignment } from '../components/evaluator-icons';
import blocks from '../components/Evaluator.module.css';
import { useEvaluatorPage } from '../hooks/useEvaluatorPage';
import { useFinalists } from '../hooks/useFinalists';
import {
  EMPTY_FILTERS,
  FINAL_STATUS_LABEL,
  countFinalists,
  courseOptions,
  describeNoResults,
  filterFinalists,
  finalistAction,
  formatDate,
  formatTime,
  formatTotal,
  hasActiveFilters,
  sdgLabel,
  sortFinalists,
  type FinalistFilters,
  type StatusFilter,
} from '../lib/finalists';
import type { FinalistRow } from '../types';
import styles from './FinalistProjectsPage.module.css';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos os status' },
  ...(['PENDING', 'IN_PROGRESS', 'FINALIZED'] as const).map((status) => ({
    value: status,
    label: FINAL_STATUS_LABEL[status],
  })),
];

/**
 * Projetos finalistas da banca do avaliador externo (Figma: 06 - Avaliador › "Projetos
 * finalistas", "Busca sem resultados", "Sem projetos atribuídos" e versão mobile).
 * O avaliador só recebe da API os projetos atribuídos a ele (RF42, P-32).
 */
export function FinalistProjectsPage() {
  const edition = useEvaluatorPage();
  const { data, isLoading, isError, error, refetch } = useFinalists();
  const [filters, setFilters] = useState<FinalistFilters>(EMPTY_FILTERS);

  const rows = useMemo(() => data?.results ?? [], [data]);
  const visible = useMemo(() => sortFinalists(filterFinalists(rows, filters)), [rows, filters]);
  const counters = countFinalists(rows);
  const courses = useMemo(() => courseOptions(rows), [rows]);

  const update = (patch: Partial<FinalistFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  const heading = (
    <EvaluatorHeading
      edition={edition}
      title="Projetos finalistas"
      description={`Consulte apenas os projetos atribuídos a você na etapa final${edition ? ` de ${edition}` : ''}.`}
    />
  );

  if (isLoading) {
    return (
      <div className={blocks.page}>
        {heading}
        <Spinner label="Carregando os projetos finalistas…" />
      </div>
    );
  }

  if (isError) {
    const formNotPublished = getApiError(error)?.code === 'final_form_not_published';
    return (
      <div className={blocks.page}>
        {heading}
        {formNotPublished ? (
          <Notice tone="warning" title="O formulário da etapa final ainda não foi publicado">
            Os projetos finalistas ficam disponíveis assim que a coordenação publicar o formulário
            de avaliação.
          </Notice>
        ) : (
          <Notice tone="danger" title="Não foi possível carregar os projetos finalistas">
            Verifique sua conexão e tente novamente.
          </Notice>
        )}
        {!formNotPublished && (
          <Button
            variant="secondary"
            size="large"
            className={styles.retry}
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        )}
        <EvaluatorFooter edition={edition} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={blocks.page}>
        {heading}
        <EmptyCard
          icon={<IconAssignment size={32} />}
          title="Nenhum projeto atribuído no momento"
          description="Os projetos serão exibidos quando a coordenação vincular você a uma banca. Não é necessário cadastrar ou solicitar projetos nesta área."
          action={
            <ButtonLink to="/" size="large">
              Voltar ao início
            </ButtonLink>
          }
          help="Em caso de dúvida, entre em contato com a coordenação do Desafio X."
        />
        <EvaluatorFooter edition={edition} />
      </div>
    );
  }

  const filtered = hasActiveFilters(filters);

  return (
    <div className={blocks.page}>
      {heading}

      <section className={blocks.card} aria-label="Busca e filtros">
        <div className={styles.filters}>
          <TextField
            className={blocks.field}
            type="search"
            label="Buscar projeto ou equipe"
            placeholder="Buscar por nome..."
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
          />
          <Select
            className={blocks.field}
            label="Curso"
            options={[{ value: '', label: 'Todos os cursos' }, ...courses]}
            value={filters.courseId}
            onChange={(event) => update({ courseId: event.target.value })}
          />
          <Select
            className={blocks.field}
            label="Status da avaliação"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(event) => update({ status: event.target.value as StatusFilter })}
          />
        </div>
        <div className={styles.counters} aria-label="Resumo da listagem">
          <Pill>{counters.assigned} atribuídos</Pill>
          <Pill tone="pending">
            {counters.pending} {counters.pending === 1 ? 'pendente' : 'pendentes'}
          </Pill>
          <Pill tone="sent">
            {counters.sent} {counters.sent === 1 ? 'enviada' : 'enviadas'}
          </Pill>
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyCard
          icon={<IconAssignment size={32} />}
          title="Nenhum projeto encontrado"
          description={describeNoResults(filters)}
          action={
            <Button size="large" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpar busca e filtros
            </Button>
          }
        />
      ) : (
        <section className={cn(blocks.card, styles.listCard)} aria-labelledby="finalists-title">
          <h2 id="finalists-title" className={styles.listTitle}>
            Projetos atribuídos à sua banca
          </h2>
          <div className={styles.tableHead} aria-hidden="true">
            <span>Projeto / equipe</span>
            <span>Curso / ODS</span>
            <span>Status</span>
            <span>Prazo / nota</span>
            <span>Ação</span>
          </div>
          <ul className={styles.list}>
            {visible.map((row) => (
              <FinalistItem key={row.project.id} row={row} />
            ))}
          </ul>
          <p className={blocks.small}>
            Exibindo {visible.length} de {rows.length} {rows.length === 1 ? 'projeto' : 'projetos'}{' '}
            · Não avaliados primeiro
            {filtered ? ' · Filtros aplicados' : ''}
          </p>
        </section>
      )}

      <EvaluatorFooter edition={edition} />
    </div>
  );
}

/** Linha da tabela no desktop e cartão no celular (Figma: "Externo · Projetos finalistas · Mobile"). */
function FinalistItem({ row }: { row: FinalistRow }) {
  const { project, team, my_evaluation_status: status } = row;
  const action = finalistAction(row);
  const sent = status === 'FINALIZED';
  const deadline = row.evaluation_deadline;
  const total = formatTotal(row.my_total_score, row.max_total_score);

  return (
    <li className={styles.item}>
      {/* Desktop: linha da tabela */}
      <div className={styles.row}>
        <div className={styles.cell}>
          <span className={blocks.strong}>{project.title}</span>
          <span>{team.name}</span>
        </div>
        <div className={styles.cell}>
          <span className={blocks.strong}>{project.course.name}</span>
          <span>{sdgLabel(project.sdg)}</span>
        </div>
        <div>
          <StatusPill status={status} />
        </div>
        <div className={styles.cell}>
          {sent ? (
            <>
              <span>{total}</span>
              <span>Somente leitura</span>
            </>
          ) : deadline ? (
            <>
              <span>{formatDate(deadline)}</span>
              <span>Até {formatTime(deadline)}</span>
            </>
          ) : (
            <span>Prazo a definir</span>
          )}
        </div>
        <Link
          to={action.to}
          className={styles.action}
          aria-label={`${action.button}: ${project.title}`}
        >
          {action.label}
        </Link>
      </div>

      {/* Celular: cartão */}
      <article className={styles.mobileCard} aria-label={project.title}>
        <StatusPill status={status} />
        <h3>{project.title}</h3>
        <p>
          {team.name} · {project.course.name}
        </p>
        <p>{sdgLabel(project.sdg)}</p>
        <p>
          {sent
            ? `Pontuação: ${total}`
            : deadline
              ? `Prazo: ${formatDate(deadline)} · ${formatTime(deadline)}`
              : 'Prazo a definir'}
        </p>
        <ButtonLink to={action.to} variant="secondary" size="large" className={styles.full}>
          {action.button}
        </ButtonLink>
      </article>
    </li>
  );
}
