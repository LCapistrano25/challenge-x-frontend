import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth';
import { NotificationsCard, useNotifications } from '@/features/notifications';
import {
  EditalCard,
  EditionHero,
  HelpResources,
  NEWS,
  NewsList,
  ProjectCarousel,
  useCurrentEdition,
  usePublicProjects,
} from '@/features/public-panel';
import {
  TeamMembersCard,
  TeamStatusCards,
  describeRequirement,
  getFormationDeadline,
  useStudentDashboard,
} from '@/features/teams';
import { usePageHeader } from '@/app/layouts/page-header-context';
import { toTimelineSteps } from '@/shared/lib/stage-timeline';
import { Alert, Button, ButtonLink, EmptyState, Spinner, Stepper } from '@/shared/ui';
import styles from './AcademicHomePage.module.css';

const PROJECTS_ON_HOME = { page_size: 4 } as const;
const NOTIFICATIONS_ON_HOME = { page_size: 3 } as const;

interface SectionQuery {
  data?: unknown;
  error: unknown;
  isLoading: boolean;
  refetch: () => unknown;
}

/**
 * Carregamento/erro de uma seção, sem derrubar o resto da página. Se uma nova busca falhar
 * e já houver dados em tela, eles continuam visíveis (o erro só aparece sem dados).
 */
function SectionState({
  query,
  label,
  children,
}: {
  query: SectionQuery;
  label: string;
  children: ReactNode;
}) {
  if (query.data !== undefined) return <>{children}</>;
  if (query.isLoading) return <Spinner label={`Carregando ${label}…`} />;
  if (query.error) {
    return (
      <Alert
        tone="danger"
        title={`Não foi possível carregar ${label}.`}
        action={
          <Button variant="secondary" size="small" onClick={() => void query.refetch()}>
            Tentar novamente
          </Button>
        }
      >
        Verifique sua conexão e tente de novo.
      </Alert>
    );
  }
  return <>{children}</>;
}

/**
 * Home do perfil Acadêmico (task #9, Figma: 03 - Acadêmico › HOME - DESK).
 * Fontes (docs/api/openapi.yaml):
 * - GET /api/me/dashboard          → equipe, pendências, prazo e cronograma (PROPOSTO, P-23)
 * - GET /api/public/editions/current → edição e edital
 * - GET /api/public/projects        → vitrine
 * - GET /api/notifications          → notificações
 * Notícias ainda não existem na API (P-35) e vêm de conteúdo estático.
 */
export function AcademicHomePage() {
  const { user } = useAuth();
  const dashboard = useStudentDashboard();
  const currentEdition = useCurrentEdition();
  const projects = usePublicProjects(PROJECTS_ON_HOME);
  const notifications = useNotifications(NOTIFICATIONS_ON_HOME);

  const firstName = user?.name.trim().split(/\s+/)[0];
  usePageHeader(
    firstName ? `Olá, ${firstName}!` : 'Olá!',
    'Bem-vindo ao seu painel de acompanhamento.',
  );
  const noticeUrl = currentEdition.data?.notice_url ?? null;
  const team = dashboard.data?.team ?? null;
  const timeline =
    dashboard.data?.stages.map((item) => item.stage) ?? currentEdition.data?.stages ?? [];

  return (
    <div className={`page-flush ${styles.page}`}>
      <SectionState query={currentEdition} label="a edição vigente">
        {currentEdition.data && (
          <EditionHero edition={currentEdition.data.edition} noticeUrl={noticeUrl} />
        )}
      </SectionState>

      <div className={styles.inset}>
        <SectionState query={dashboard} label="sua equipe">
          {dashboard.data && !team && (
            <Alert
              tone="info"
              title="Você ainda não participa de uma equipe."
              action={
                <ButtonLink to="/academico/equipe/buscar" size="small">
                  Encontrar equipe
                </ButtonLink>
              }
            >
              Crie uma equipe ou peça para entrar em uma com vagas.
            </Alert>
          )}

          {dashboard.data && dashboard.data.incomplete_requirements.length > 0 && (
            <Alert tone="warning" title="Sua equipe ainda está incompleta.">
              <ul className={styles.requirements}>
                {dashboard.data.incomplete_requirements.map((requirement) => (
                  <li key={requirement}>{describeRequirement(requirement)}.</li>
                ))}
              </ul>
            </Alert>
          )}

          {dashboard.data && team && (
            <TeamStatusCards
              membersCount={team.members.length}
              maxMembers={dashboard.data.max_members}
              pendingActions={dashboard.data.pending_actions.length}
              formationDeadline={getFormationDeadline(dashboard.data)}
            />
          )}
        </SectionState>
      </div>

      <div className={`${styles.inset} ${styles.teamRow}`}>
        {team && <TeamMembersCard members={team.members} />}
        <SectionState query={notifications} label="as notificações">
          <NotificationsCard notifications={notifications.data?.results ?? []} />
        </SectionState>
      </div>

      <section className={`${styles.inset} ${styles.projects}`} aria-labelledby="projects-title">
        <h2 id="projects-title" className={styles.sectionTitle}>
          Projetos
        </h2>
        <SectionState query={projects} label="os projetos">
          {projects.data && projects.data.results.length > 0 ? (
            <ProjectCarousel projects={projects.data.results} />
          ) : (
            <EmptyState
              title="Nenhum projeto publicado ainda"
              description="Os projetos aparecem aqui assim que as equipes os cadastrarem."
            />
          )}
        </SectionState>
        <ButtonLink to="/projetos" size="large" className={styles.projectsAction}>
          Ver Todos
        </ButtonLink>
      </section>

      {timeline.length > 0 && (
        <section className={styles.stages} aria-labelledby="stages-title">
          <h2 id="stages-title" className={styles.sectionTitle}>
            Status das Entregas por Etapas
          </h2>
          <div className={styles.timeline}>
            <h3 className={styles.timelineTitle}>Cronograma</h3>
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

      <div className={`${styles.inset} ${styles.infoRow}`}>
        <NewsList items={NEWS} allNewsHref="/" className={styles.news} />
        <HelpResources rulesUrl={noticeUrl} faqHref="/academico/duvidas" className={styles.help} />
      </div>

      {currentEdition.data && noticeUrl && (
        <EditalCard edition={currentEdition.data.edition} noticeUrl={noticeUrl} />
      )}
    </div>
  );
}
