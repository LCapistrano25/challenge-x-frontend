import { useMemo, useState } from 'react';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  IconCalendar,
  ProgressBar,
  Select,
  Spinner,
  TextField,
} from '@/shared/ui';
import { DeliveriesTable } from '../components/DeliveriesTable';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';
import {
  STATUS_LABEL,
  deliveryPath,
  filterDeliveries,
  formatDeadline,
  summarize,
  type DeliveryFilters,
} from '../lib/delivery-view';
import styles from './DeliveryTrackingPage.module.css';

const NO_FILTERS: DeliveryFilters = { course: '', status: '', query: '' };

/** Painel inicial do professor: acompanhamento das entregas dos cursos vinculados. */
export function DeliveryTrackingPage() {
  const { data, isLoading, isError, refetch } = useTeacherDashboard();
  const [filters, setFilters] = useState<DeliveryFilters>(NO_FILTERS);

  usePageHeader(
    'Painel de Acompanhamento do Curso',
    data ? `Projetos dos seus cursos vinculados • ${data.stage_label}` : undefined,
  );

  const summary = useMemo(() => summarize(data?.deliveries ?? []), [data]);
  const visible = useMemo(() => filterDeliveries(data?.deliveries ?? [], filters), [data, filters]);

  if (isLoading) return <Spinner label="Carregando o painel…" />;
  if (isError || !data) {
    return (
      <Alert
        tone="danger"
        title="Não foi possível carregar o painel"
        action={
          <Button size="small" variant="secondary" onClick={() => void refetch()}>
            Tentar de novo
          </Button>
        }
      >
        Verifique sua conexão e tente novamente.
      </Alert>
    );
  }

  const hasFilters = filters.course !== '' || filters.status !== '' || filters.query !== '';
  const update = (key: keyof DeliveryFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section className={styles.page} aria-label="Acompanhamento das entregas">
      <dl className={styles.summary}>
        <div className={`${styles.card} ${styles.total}`}>
          <dt>Projetos nos cursos vinculados</dt>
          <dd>{summary.total}</dd>
        </div>
        <div className={`${styles.card} ${styles.pending}`}>
          <dt>Entregas que faltam avaliar</dt>
          <dd>{summary.pending}</dd>
        </div>
        <div className={`${styles.card} ${styles.done}`}>
          <dt>Entregas avaliadas</dt>
          <dd>{summary.evaluated}</dd>
        </div>
      </dl>

      <div className={styles.progressRow}>
        <div className={styles.progress}>
          <div className={styles.progressLabels}>
            <span>Seu progresso</span>
            <span>
              {summary.evaluated} de {summary.total} avaliados • {summary.progress}%
            </span>
          </div>
          <ProgressBar value={summary.progress} label="Progresso das suas avaliações" size="sm" />
        </div>
        <p className={styles.deadline}>
          Prazo para concluir as avaliações: {formatDeadline(data.evaluation_deadline)}
        </p>
      </div>

      <div className={styles.filters} role="search" aria-label="Filtrar projetos">
        <Select
          label="Curso vinculado"
          value={filters.course}
          onChange={(event) => update('course', event.target.value)}
          options={[
            { value: '', label: `Todos os cursos (${data.courses.length})` },
            ...data.courses.map((course) => ({ value: course, label: course })),
          ]}
        />
        <Select
          label="Status da entrega"
          value={filters.status}
          onChange={(event) => update('status', event.target.value)}
          options={[
            { value: '', label: 'Todos os status' },
            ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        <TextField
          label="Buscar projeto ou equipe"
          type="search"
          placeholder="Buscar por nome..."
          value={filters.query}
          onChange={(event) => update('query', event.target.value)}
        />
        <Button variant="ghost" disabled={!hasFilters} onClick={() => setFilters(NO_FILTERS)}>
          Limpar filtros
        </Button>
      </div>

      {summary.next && (
        <div className={styles.priority}>
          <IconCalendar size={22} className={styles.priorityIcon} aria-hidden="true" />
          <div className={styles.priorityText}>
            <p>
              {summary.awaiting === 1
                ? '1 projeto aguarda sua avaliação.'
                : `${summary.awaiting} projetos aguardam sua avaliação.`}
            </p>
            <p>
              Comece pelo {summary.next.project_name}, da {summary.next.team_name}. Os materiais já
              estão disponíveis.
            </p>
          </div>
          <ButtonLink to={deliveryPath(summary.next)} size="large">
            Avaliar próximo projeto
          </ButtonLink>
        </div>
      )}

      {visible.length > 0 ? (
        <DeliveriesTable deliveries={visible} total={summary.total} />
      ) : (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Ajuste os filtros ou limpe a busca para ver todas as entregas."
          action={
            <Button variant="secondary" onClick={() => setFilters(NO_FILTERS)}>
              Limpar filtros
            </Button>
          }
        />
      )}

      <p className={styles.context}>Desafio X / Área docente / Semestre {data.semester}</p>
    </section>
  );
}
