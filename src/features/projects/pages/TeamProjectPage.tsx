import { Link, Navigate } from 'react-router-dom';
import {
  describeMembersBadge,
  findLeader,
  formatLongDate,
  useStudentDashboard,
  type StudentDashboard,
  type Team,
} from '@/features/teams';
import { usePageHeader } from '@/shared/lib/page-header';
import { toTimelineSteps } from '@/shared/lib/stage-timeline';
import { Alert, Button, ButtonLink, EmptyState, Spinner, Stepper } from '@/shared/ui';
import { ProjectInfoCard } from '../components/ProjectInfoCard';
import { ProjectSummaryCard } from '../components/ProjectSummaryCard';
import { StageDeliveryList } from '../components/StageDeliveryList';
import { useProjectDeliverables } from '../hooks/useProjectDeliverables';
import { useTeamProject } from '../hooks/useProjectRegistration';
import { getProjectMetrics } from '../lib/deliverables';
import { isProjectIncomplete } from '../lib/project-registration';
import {
  EDIT_PROJECT_PATH,
  describeProjectContext,
  describeResponsibles,
  submitDeliveryPath,
} from '../lib/team-project';
import type { Project } from '../types';
import styles from '../components/TeamProject.module.css';

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

/**
 * Projeto da equipe (task #13, Figma: 03 - Acadêmico › "Projeto — cadastrado", líder 551:12364 e
 * participante 555:8606). Resumo do projeto, indicadores, entregas por etapa (com histórico de
 * versões e aviso de reenvio) e cronograma da edição. Qualquer integrante envia arquivos; só a
 * liderança edita os dados cadastrais.
 *
 * Fontes (docs/api/openapi.yaml):
 * - GET /api/me/dashboard                    → equipe, papel e cronograma (PROPOSTO, P-23)
 * - GET /api/teams/{id}/project              → projeto (404 = ainda não cadastrado)
 * - GET /api/projects/{id}/deliverables      → etapas, campos, status e versões (RF31)
 * Propostas pendentes no back-end: descrição/orientação da etapa, parecer da orientação
 * (Aprovada / Ajustes solicitados) e Project.updated_by (ver api/README.md).
 */
export function TeamProjectPage() {
  usePageHeader(
    'Projeto da equipe',
    'Acompanhe as etapas, consulte os envios e mantenha seu projeto atualizado.',
  );

  const dashboard = useStudentDashboard();
  const team = dashboard.data?.team ?? null;
  const isLeader = dashboard.data?.is_leader === true;
  const project = useTeamProject(team?.id);

  if (dashboard.isPending || (team && project.isPending)) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <Spinner label="Carregando o projeto…" />
      </div>
    );
  }

  if (!dashboard.data) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <LoadError what="o projeto da equipe" onRetry={() => void dashboard.refetch()} />
      </div>
    );
  }

  if (!team) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <EmptyState
          title="Você ainda não participa de uma equipe"
          description="O projeto é acompanhado pela equipe. Crie uma equipe ou entre em uma para participar."
          action={<ButtonLink to="/academico/equipe/buscar">Encontrar equipe</ButtonLink>}
        />
        <Footer />
      </div>
    );
  }

  if (project.data === undefined) {
    return (
      <div className={`page-flush ${styles.page}`}>
        <LoadError what="o projeto da equipe" onRetry={() => void project.refetch()} />
      </div>
    );
  }

  if (!project.data || isProjectIncomplete(project.data)) {
    // O líder segue para o cadastro (task #12); os demais aguardam a liderança.
    if (isLeader) return <Navigate to="/academico/projeto/novo" replace />;
    return (
      <div className={`page-flush ${styles.page}`}>
        <EmptyState
          title="O projeto da equipe ainda não foi cadastrado"
          description="A liderança cadastra o projeto. Depois disso, as etapas e as entregas aparecem aqui."
          action={<ButtonLink to="/academico/equipe">Ver minha equipe</ButtonLink>}
        />
        <Footer />
      </div>
    );
  }

  return (
    <TeamProjectContent
      dashboard={dashboard.data}
      team={team}
      project={project.data}
      isLeader={isLeader}
    />
  );
}

interface TeamProjectContentProps {
  dashboard: StudentDashboard;
  team: Team;
  project: Project;
  isLeader: boolean;
}

function TeamProjectContent({ dashboard, team, project, isLeader }: TeamProjectContentProps) {
  const deliverables = useProjectDeliverables(project.id);
  const items = deliverables.data ?? [];
  const timeline = dashboard.stages.map((item) => item.stage);
  const teamLine = `${team.name} · ${describeMembersBadge(team.members.length)}`;

  return (
    <div className={`page-flush ${styles.page}`}>
      <div className={styles.summaryRow}>
        <ProjectSummaryCard
          project={project}
          memberNames={team.members.map((member) => member.student.name)}
          editHref={isLeader ? EDIT_PROJECT_PATH : undefined}
        />
        <ProjectInfoCard
          project={project}
          teamLine={teamLine}
          responsibleLine={describeResponsibles(findLeader(team)?.student.name ?? null, project)}
          contextLine={describeProjectContext(project, team, dashboard.edition)}
          metrics={getProjectMetrics(items)}
        />
      </div>

      {deliverables.isPending ? (
        <Spinner label="Carregando as entregas…" />
      ) : deliverables.isError && !deliverables.data ? (
        <LoadError what="as entregas por etapa" onRetry={() => void deliverables.refetch()} />
      ) : (
        <StageDeliveryList items={items} submitHref={submitDeliveryPath} />
      )}

      {timeline.length > 0 && (
        <section className={styles.card} aria-labelledby="edition-timeline-title">
          <h2 id="edition-timeline-title" className={styles.h3}>
            Cronograma da edição
          </h2>
          <div className={styles.timeline}>
            <p className={styles.timelineTitle}>Da inscrição à divulgação dos finalistas</p>
            <div className={styles.timelineBox}>
              <Stepper
                variant="timeline"
                steps={toTimelineSteps(timeline)}
                label="Cronograma da edição"
              />
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
