import { useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth';
import { usePageHeader } from '@/shared/lib/page-header';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  IconCalendar,
  IconCheckCircle,
  IconClipboard,
  IconUser,
  IconUsers,
  ProgressBar,
  Select,
  Spinner,
  Stepper,
  type Step,
} from '@/shared/ui';
import { useAdminOverview } from '../hooks/useAdminOverview';
import type { AdminMetric } from '../types';
import styles from './AdminDashboard.module.css';

const METRIC_ICON: Record<string, ReactNode> = {
  projects: <IconClipboard size={20} />,
  teams: <IconUsers size={20} />,
  courses: <IconUser size={20} />,
  stages: <IconCalendar size={20} />,
};

const formatLongDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );

/**
 * Painel Administrativo (Figma: 04 - Administrador › "Painel Administrativo", RF20). Visão geral
 * da edição em preparação: métricas, ações rápidas, gestão da edição (progresso e cronograma) e
 * as pendências. Dados vêm de GET /api/admin/overview (PROPOSTO).
 */
export function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useAdminOverview();
  const [editionId, setEditionId] = useState<string>('');

  const firstName = user?.name.trim().split(/\s+/)[0] ?? data?.admin_name ?? 'Administrador';
  usePageHeader('Painel Administrativo', 'Gestão da edição e acompanhamento geral.');

  const steps = useMemo<Step[]>(
    () => data?.edition_management.timeline ?? [],
    [data?.edition_management.timeline],
  );

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

  const management = data.edition_management;
  const selectedEdition = editionId || String(data.edition.id);

  return (
    <section className={`page-flush ${styles.page}`} aria-label="Painel administrativo">
      <header className={styles.top}>
        <div className={styles.greeting}>
          <h2 className={styles.hello}>Olá, {firstName}!</h2>
          <p className={styles.helloSub}>
            Prepare a próxima edição e acompanhe a gestão em um só lugar.
          </p>
        </div>
        <div className={styles.editionControls}>
          <Select
            label="Edição atual"
            value={selectedEdition}
            onChange={(event) => setEditionId(event.target.value)}
            options={data.editions.map((edition) => ({
              value: String(edition.id),
              label: edition.label,
            }))}
          />
          <div className={styles.editionMeta}>
            <Badge tone="progress">{data.edition.status_label}</Badge>
            <span className={styles.date}>{formatLongDate(data.today)}</span>
          </div>
        </div>
      </header>

      <dl className={styles.metrics}>
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </dl>

      <section aria-label="Ações rápidas" className={styles.quick}>
        <p className={styles.quickLabel}>Ações rápidas</p>
        <div className={styles.quickActions}>
          {data.quick_actions.map((action) =>
            action.disabled || !action.to ? (
              <Button
                key={action.label}
                variant={action.primary ? 'primary' : 'secondary'}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ) : (
              <ButtonLink
                key={action.label}
                to={action.to}
                variant={action.primary ? 'primary' : 'secondary'}
              >
                {action.label}
              </ButtonLink>
            ),
          )}
        </div>
      </section>

      <section className={styles.card} aria-label="Gestão da edição">
        <header className={styles.cardHead}>
          <div>
            <h3 className={styles.cardTitle}>Gestão da edição</h3>
            <p className={styles.cardMeta}>
              {management.title} • {management.phase}
            </p>
          </div>
          <ButtonLink to={management.manage_to} variant="ghost" size="small">
            Gerenciar edição
          </ButtonLink>
        </header>

        <div className={styles.progressBox}>
          <div className={styles.progressLabels}>
            <span>Configuração da edição</span>
            <span>
              <strong className={styles.percent}>{management.progress_percent}%</strong>{' '}
              {management.requirements_done} de {management.requirements_total} requisitos
              concluídos
            </span>
          </div>
          <ProgressBar
            value={management.progress_percent}
            label="Progresso da configuração da edição"
          />
        </div>

        <div className={styles.timeline}>
          <h4 className={styles.subTitle}>Cronograma previsto</h4>
          <Stepper steps={steps} variant="timeline" label="Cronograma previsto" />
        </div>

        <div
          className={`${styles.pointsNote} ${management.points.valid ? styles.valid : styles.invalid}`}
        >
          <IconCheckCircle size={20} className={styles.pointsIcon} aria-hidden="true" />
          <div className={styles.pointsText}>
            <strong>
              Pontuação {management.points.valid ? 'válida' : 'inválida'}: {management.points.total}{' '}
              de {management.points.max} pontos
            </strong>
            <p>{management.points.formula}</p>
          </div>
          <span className={styles.pointsHint}>Soma exata obrigatória</span>
        </div>
      </section>

      <div className={styles.bottom}>
        <section className={styles.card} aria-label="Equipes e projetos">
          <header className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Equipes e projetos</h3>
            <ButtonLink to="/admin/equipes" variant="ghost" size="small">
              Ver todas
            </ButtonLink>
          </header>
          <ul className={styles.teamList}>
            {data.teams.map((team) => (
              <li key={team.id} className={styles.teamRow}>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.teamMeta}>
                    {team.project} · {team.course}
                  </span>
                </div>
                <Badge tone="neutral">{team.status_label}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-label="Pendências">
          <header className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Pendências</h3>
            <Badge tone="brand">{data.pendencias.length} itens</Badge>
          </header>
          <ul className={styles.pendList}>
            {data.pendencias.map((item) => (
              <li key={item.id} className={styles.pendRow}>
                <div className={styles.pendInfo}>
                  <span className={styles.pendTitle}>{item.title}</span>
                  <span className={styles.pendDesc}>{item.description}</span>
                </div>
                {item.to && (
                  <ButtonLink to={item.to} variant="ghost" size="small">
                    Resolver
                  </ButtonLink>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className={styles.footer}>Desafio X · Administração · {data.edition.label}</p>
    </section>
  );
}

function MetricCard({ metric }: { metric: AdminMetric }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricHead}>
        <dt>{metric.label}</dt>
        <span className={styles.metricIcon} aria-hidden="true">
          {METRIC_ICON[metric.key]}
        </span>
      </div>
      <dd className={styles.metricValue}>{metric.value}</dd>
      <dd className={styles.metricCaption}>{metric.caption}</dd>
    </div>
  );
}
