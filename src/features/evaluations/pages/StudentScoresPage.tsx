import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTeamProject } from '@/features/projects';
import { formatLongDate, useStudentDashboard } from '@/features/teams';
import { cn } from '@/shared/lib/cn';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, EmptyState, Spinner } from '@/shared/ui';
import { useProjectScores } from '../hooks/useProjectScores';
import {
  SCORE_STATUS_LABEL,
  describeStageScore,
  formatScore,
  isFinal,
  summarizeScores,
} from '../lib/scores';
import type { StageScoreDetail } from '../types';
import styles from '../components/StudentScores.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <p>Desafio X · Programa de inovação acadêmica</p>
      <p>
        {formatLongDate(new Date())} · <Link to="/academico/duvidas">Regulamento e ajuda</Link>
      </p>
    </footer>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className={`page-flush ${styles.page}`}>
      {children}
      <Footer />
    </div>
  );
}

function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <Alert
      tone="danger"
      title={`Não foi possível carregar ${what}.`}
      action={
        <Button variant="secondary" size="small" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    >
      Verifique sua conexão e tente novamente.
    </Alert>
  );
}

function StageScoreCard({ item }: { item: StageScoreDetail }) {
  const final = isFinal(item);
  const comments = item.feedback.filter((entry) => entry.comment?.trim());
  return (
    <li className={styles.stage}>
      <div className={styles.stageHeader}>
        <div className={styles.stageName}>
          <p className={styles.caption}>Etapa {item.stage.position}</p>
          <h3 className={styles.h3}>{item.stage.name}</h3>
        </div>
        <span className={cn(styles.tag, final ? styles.tagPositive : styles.tagNeutral)}>
          {SCORE_STATUS_LABEL[item.status]}
        </span>
        {final ? (
          <p className={styles.score}>
            <span className={styles.scoreValue}>{formatScore(item.value ?? 0)}</span>
            <span className={styles.caption}> de {formatScore(item.points_value)} pontos</span>
          </p>
        ) : (
          <p className={cn(styles.score, styles.caption)}>
            Vale {formatScore(item.points_value)} pontos
          </p>
        )}
      </div>
      <p className={styles.text}>{describeStageScore(item)}</p>

      {final && item.criteria.length > 0 && (
        <table className={styles.criteria}>
          <caption className="sr-only">Média por critério em {item.stage.name}</caption>
          <thead>
            <tr>
              <th scope="col">Critério</th>
              <th scope="col">Média</th>
            </tr>
          </thead>
          <tbody>
            {item.criteria.map((entry) => (
              <tr key={entry.criterion.id}>
                <th scope="row">{entry.criterion.name}</th>
                <td>
                  {entry.average != null ? formatScore(entry.average) : '—'} de{' '}
                  {formatScore(entry.max_score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {final && comments.length > 0 && (
        <div className={styles.feedback}>
          <p className={styles.feedbackTitle}>Parecer da orientação</p>
          {comments.map((entry, index) => (
            <p key={index} className={styles.text}>
              {entry.comment}
            </p>
          ))}
        </div>
      )}
    </li>
  );
}

/**
 * Notas da equipe por etapa (item "Notas" da barra lateral). Ainda não há tela no Figma: o
 * layout segue os cartões de "Projeto da equipe".
 *
 * Fontes (docs/api/openapi.yaml):
 * - GET /api/me/dashboard               → equipe (PROPOSTO, P-23)
 * - GET /api/teams/{team_id}/project    → projeto da equipe
 * - GET /api/projects/{id}/scores       → notas, médias por critério e feedbacks (RF32, confirmado)
 * Regras (RF32): a nota só aparece quando definitiva; abaixo do mínimo de avaliadores fica
 * "Pendente" e sem valor; sem entrega no prazo, nota zero.
 */
export function StudentScoresPage() {
  usePageHeader('Notas', 'Acompanhe as notas e os pareceres de cada etapa avaliada.');

  const dashboard = useStudentDashboard();
  const team = dashboard.data?.team ?? null;
  const project = useTeamProject(team?.id, { enabled: team != null });
  const scores = useProjectScores(project.data?.id);

  if (dashboard.isPending || (team && project.isPending)) {
    return (
      <Page>
        <Spinner label="Carregando as notas…" />
      </Page>
    );
  }
  if (dashboard.isError) {
    return (
      <Page>
        <LoadError what="sua equipe" onRetry={() => void dashboard.refetch()} />
      </Page>
    );
  }
  if (!team) {
    return (
      <Page>
        <EmptyState
          title="Você ainda não participa de uma equipe"
          description="As notas são da equipe. Entre em uma equipe para acompanhar a avaliação das etapas."
          action={<ButtonLink to="/academico/equipe/buscar">Encontrar equipe</ButtonLink>}
        />
      </Page>
    );
  }
  if (!project.data) {
    return (
      <Page>
        <EmptyState
          title="O projeto da equipe ainda não foi cadastrado"
          description="Depois do cadastro e das primeiras entregas avaliadas, as notas aparecem aqui."
          action={<ButtonLink to="/academico/projeto">Ver projeto</ButtonLink>}
        />
      </Page>
    );
  }
  if (scores.isPending) {
    return (
      <Page>
        <Spinner label="Carregando as notas…" />
      </Page>
    );
  }
  if (scores.isError) {
    return (
      <Page>
        <LoadError what="as notas" onRetry={() => void scores.refetch()} />
      </Page>
    );
  }

  const stages = [...scores.data.stages].sort((a, b) => a.stage.position - b.stage.position);
  const summary = summarizeScores(stages);

  return (
    <Page>
      <section className={styles.card} aria-labelledby="scores-summary-title">
        <div className={styles.cardHeader}>
          <h2 id="scores-summary-title" className={styles.h3}>
            {scores.data.project.title}
          </h2>
          <span className={cn(styles.tag, styles.tagPrimary)}>{team.name}</span>
        </div>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <p className={styles.metricValue}>
              {formatScore(summary.earned)}{' '}
              <span className={styles.caption}>de {formatScore(summary.total)}</span>
            </p>
            <p className={styles.caption}>pontos em notas definitivas</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricValue}>
              {summary.finalCount} de {summary.stageCount}
            </p>
            <p className={styles.caption}>etapas com nota definitiva</p>
          </div>
        </div>
        <p className={styles.caption}>
          A nota de cada etapa é a média das avaliações da orientação e só aparece quando é
          definitiva.
        </p>
      </section>

      <section className={styles.card} aria-labelledby="scores-stages-title">
        <h2 id="scores-stages-title" className={styles.h3}>
          Notas por etapa
        </h2>
        {stages.length === 0 ? (
          <p className={styles.text}>Nenhuma etapa pontuada nesta edição até o momento.</p>
        ) : (
          <ul className={styles.stages}>
            {stages.map((item) => (
              <StageScoreCard key={item.stage.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
