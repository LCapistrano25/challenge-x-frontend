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
  InvitationsCard,
  JourneyCard,
  NoTeamStatusCards,
  TeamMembersCard,
  TeamStartCard,
  TeamStatusCards,
  describeRequirement,
  describeTeamError,
  getFormationDeadline,
  useCancelJoinRequest,
  useMyPendingInvitations,
  useMyPendingJoinRequests,
  useRespondInvitation,
  useStudentDashboard,
  type Invitation,
  type JoinRequest,
} from '@/features/teams';
import { usePageHeader } from '@/app/layouts/page-header-context';
import { toTimelineSteps } from '@/shared/lib/stage-timeline';
import type { StageSchedule } from '@/shared/types/api';
import { Alert, Button, ButtonLink, EmptyState, Spinner, Stepper, notify } from '@/shared/ui';
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
 * Notícias ainda não têm página própria (P-35): cada "Leia mais" leva ao conteúdo
 * relacionado que já existe na área acadêmica, e "Ver todas" não aparece.
 */
function academicNews(noticeUrl: string | null) {
  const href: Record<string, string | undefined> = {
    'edital-publicado': noticeUrl ?? undefined,
    'preparar-submissao': '/academico/duvidas',
    'canal-duvidas': '/academico/duvidas',
  };
  return NEWS.map((item) => ({ ...item, href: item.href ?? href[item.id] }));
}

/**
 * Home do aluno sem equipe (Figma: 03 - Acadêmico › Home — sem equipe, 551:11696).
 * Convites: GET /api/me/invitations e POST /api/invitations/{id}/respond (RF23);
 * solicitação enviada: GET /api/me/join-requests (RF24).
 */
function TeamlessHome({
  formationDeadline,
  noticeUrl,
}: {
  formationDeadline: string | null;
  noticeUrl: string | null;
}) {
  const invitations = useMyPendingInvitations();
  const joinRequests = useMyPendingJoinRequests();
  const notifications = useNotifications(NOTIFICATIONS_ON_HOME);
  const respond = useRespondInvitation();
  const cancelRequest = useCancelJoinRequest();
  const pending = invitations.data ?? [];
  const sentRequest = joinRequests.data?.[0] ?? null;

  function handleRespond(invitation: Invitation, status: 'ACCEPTED' | 'DECLINED') {
    respond.mutate(
      { id: invitation.id, status },
      {
        onSuccess: () =>
          notify.success(
            status === 'ACCEPTED'
              ? `Você entrou na equipe ${invitation.team.name}.`
              : `Convite da equipe ${invitation.team.name} recusado.`,
          ),
        onError: (error) =>
          notify.error(describeTeamError(error, 'Não foi possível responder ao convite.')),
      },
    );
  }

  function handleCancel(request: JoinRequest) {
    cancelRequest.mutate(request.id, {
      onSuccess: () => notify.success('Solicitação cancelada.'),
      onError: (error) =>
        notify.error(describeTeamError(error, 'Não foi possível cancelar a solicitação.')),
    });
  }

  return (
    <>
      <div className={styles.inset}>
        <NoTeamStatusCards
          invitationsCount={pending.length}
          formationDeadline={formationDeadline}
        />
      </div>

      <div className={`${styles.inset} ${styles.startRow}`}>
        <TeamStartCard />
        <SectionState query={notifications} label="as notificações">
          <NotificationsCard
            notifications={notifications.data?.results ?? []}
            action={
              noticeUrl ? (
                <ButtonLink to={noticeUrl} variant="ghost" size="large">
                  Ver regulamento
                </ButtonLink>
              ) : undefined
            }
          />
        </SectionState>
      </div>

      <div className={styles.inset}>
        <SectionState query={invitations} label="os convites">
          <InvitationsCard
            invitations={pending}
            sentRequest={sentRequest}
            formationDeadline={formationDeadline}
            busyInvitationId={respond.isPending ? respond.variables?.id : null}
            cancellingRequest={cancelRequest.isPending}
            onRespond={handleRespond}
            onCancelRequest={handleCancel}
          />
        </SectionState>
      </div>

      <div className={styles.inset}>
        <JourneyCard formationDeadline={formationDeadline} />
      </div>
    </>
  );
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
  const teamless = dashboard.data !== undefined && !dashboard.data.team;
  const notifications = useNotifications(NOTIFICATIONS_ON_HOME);

  const firstName = user?.name.trim().split(/\s+/)[0];
  usePageHeader(
    firstName ? `Olá, ${firstName}!` : 'Olá!',
    'Bem-vindo ao seu painel de acompanhamento.',
  );
  const noticeUrl = currentEdition.data?.notice_url ?? null;
  const timeline =
    dashboard.data?.stages.map((item) => item.stage) ?? currentEdition.data?.stages ?? [];

  return (
    <div className={`page-flush ${styles.page}`}>
      <SectionState query={currentEdition} label="a edição vigente">
        {currentEdition.data && (
          <EditionHero edition={currentEdition.data.edition} noticeUrl={noticeUrl} />
        )}
      </SectionState>

      {teamless && dashboard.data && (
        <TeamlessHome
          formationDeadline={getFormationDeadline(dashboard.data)}
          noticeUrl={noticeUrl}
        />
      )}

      {!teamless && (
        <TeamHomeSections
          dashboard={dashboard}
          notifications={notifications}
          projects={projects}
          timeline={timeline}
          noticeUrl={noticeUrl}
        />
      )}

      {currentEdition.data && noticeUrl && !teamless && (
        <EditalCard edition={currentEdition.data.edition} noticeUrl={noticeUrl} />
      )}
    </div>
  );
}

/** Home de quem já tem equipe (Figma: HOME - DESK / HOME LÍDER). */
function TeamHomeSections({
  dashboard,
  notifications,
  projects,
  timeline,
  noticeUrl,
}: {
  dashboard: ReturnType<typeof useStudentDashboard>;
  notifications: ReturnType<typeof useNotifications>;
  projects: ReturnType<typeof usePublicProjects>;
  timeline: StageSchedule[];
  noticeUrl: string | null;
}) {
  const team = dashboard.data?.team ?? null;
  return (
    <>
      <div className={styles.inset}>
        <SectionState query={dashboard} label="sua equipe">
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
        <NewsList items={academicNews(noticeUrl)} className={styles.news} />
        <HelpResources rulesUrl={noticeUrl} faqHref="/academico/duvidas" className={styles.help} />
      </div>
    </>
  );
}
