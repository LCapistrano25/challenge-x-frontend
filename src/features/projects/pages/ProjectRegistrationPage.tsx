import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  formatDate,
  formatLongDate,
  getFormationWindow,
  useStudentDashboard,
  type FormationWindow,
  type Team,
} from '@/features/teams';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, EmptyState, Spinner } from '@/shared/ui';
import { ProjectForm } from '../components/ProjectForm';
import {
  BeforeRegisteringCard,
  DeadlineCard,
  GuidanceCard,
  ResponsibleTeamCard,
} from '../components/RegistrationSidebar';
import {
  useProjectDraft,
  useProjectOptions,
  useTeamProject,
} from '../hooks/useProjectRegistration';
import { fromProjectDraft, isProjectIncomplete, projectToDraft } from '../lib/project-registration';
import type { Project } from '../types';
import styles from '../components/ProjectRegistration.module.css';

const TEAM_PROJECT_PATH = '/academico/projeto';

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
  return <div className={`page-flush ${styles.page}`}>{children}</div>;
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
 * Cadastro do projeto (task #12, Figma: 03 - Acadêmico › "Projeto — cadastro", 551:12196).
 * Só o líder cadastra; os demais veem acesso restrito. O cadastro respeita o prazo da formação
 * (etapa FORMATION da edição). Depois de cadastrar, a equipe segue para a tela do Projeto.
 *
 * Fontes (docs/api/openapi.yaml):
 * - GET /api/me/dashboard                    → equipe, is_leader e etapas (PROPOSTO, P-23)
 * - GET /api/teams/{id}/project              → projeto já cadastrado (404 = ainda não)
 * - GET /api/teams/{id}/project/options      → desafios (com a ODS) e categorias elegíveis
 * - PUT /api/teams/{id}/project              → cadastrar (PROPOSTO, P-25)
 * Propostas pendentes no back-end: rascunho (GET/PUT …/project/draft) e os campos descritivos
 * do Figma em ProjectWrite (ver api/README.md).
 */
export function ProjectRegistrationPage() {
  // "Editar projeto" (task #13): mesmo formulário, preenchido com o projeto cadastrado.
  const [params] = useSearchParams();
  const editing = params.has('editar');
  usePageHeader(
    editing ? 'Editar projeto' : 'Cadastrar projeto',
    editing
      ? 'Atualize os dados cadastrais do projeto da equipe.'
      : 'Apresente a proposta da equipe e dê o próximo passo no Desafio X.',
  );

  const dashboard = useStudentDashboard();
  const team = dashboard.data?.team ?? null;
  const isLeader = dashboard.data?.is_leader === true;
  const project = useTeamProject(team?.id, { enabled: isLeader });

  if (dashboard.isPending) {
    return (
      <Page>
        <Spinner label="Carregando o cadastro do projeto…" />
      </Page>
    );
  }

  // Só mostra o erro sem dados: se um recarregamento em segundo plano falhar, a tela continua
  // com os dados que já tem (o React Query mantém `data` e marca `isError`).
  if (!dashboard.data) {
    return (
      <Page>
        <LoadError what="o cadastro do projeto" onRetry={() => void dashboard.refetch()} />
      </Page>
    );
  }

  if (!team) {
    return (
      <Page>
        <EmptyState
          title="Você ainda não participa de uma equipe"
          description="O projeto é cadastrado pela liderança da equipe. Crie uma equipe ou entre em uma para participar."
          action={<ButtonLink to="/academico/equipe/buscar">Encontrar equipe</ButtonLink>}
        />
        <Footer />
      </Page>
    );
  }

  if (!isLeader) {
    return (
      <Page>
        <EmptyState
          title="Acesso restrito à liderança da equipe"
          description="Somente o líder pode cadastrar o projeto. Acompanhe o andamento com a sua equipe."
          action={<ButtonLink to="/academico/equipe">Ver minha equipe</ButtonLink>}
        />
        <Footer />
      </Page>
    );
  }

  if (project.isPending) {
    return (
      <Page>
        <Spinner label="Carregando o cadastro do projeto…" />
      </Page>
    );
  }

  if (project.data === undefined) {
    return (
      <Page>
        <LoadError what="o projeto da equipe" onRetry={() => void project.refetch()} />
      </Page>
    );
  }

  // Projeto já completo: a equipe acompanha pela tela do Projeto; a liderança edita por lá.
  if (project.data && !isProjectIncomplete(project.data) && !editing) {
    return <Navigate to={TEAM_PROJECT_PATH} replace />;
  }

  const formation = getFormationWindow(dashboard.data.stages.map((item) => item.stage));
  return <RegistrationContent team={team} formation={formation} project={project.data} />;
}

interface RegistrationContentProps {
  team: Team;
  formation: FormationWindow;
  /** Projeto já cadastrado: o formulário abre em modo de edição (sem rascunho). */
  project: Project | null;
}

function RegistrationContent({ team, formation, project }: RegistrationContentProps) {
  const navigate = useNavigate();
  const options = useProjectOptions(team.id);
  const draft = useProjectDraft(team.id, { enabled: !project });
  // A API pode encerrar o prazo antes do que a tela calculou (409 formation_closed).
  const [closedByApi, setClosedByApi] = useState(false);

  const closed = closedByApi || formation.status === 'CLOSED';
  const upcoming = formation.status === 'UPCOMING';
  const deadline = formation.endsAt ? formatDate(formation.endsAt) : null;

  return (
    <Page>
      <div
        className={closed ? `${styles.notice} ${styles.noticeClosed}` : styles.notice}
        role="status"
      >
        {closed ? (
          <>
            <p className={styles.noticeTitle}>O prazo de cadastro do projeto terminou</p>
            <p>
              {deadline
                ? `O cadastro estava disponível até ${deadline}.`
                : 'O cadastro estava disponível durante a formação das equipes.'}{' '}
              Em caso de dúvida, procure a coordenação do Desafio X.
            </p>
          </>
        ) : upcoming ? (
          <>
            <p className={styles.noticeTitle}>O cadastro do projeto ainda não começou</p>
            <p>
              {formation.startsAt
                ? `O cadastro abre em ${formatDate(formation.startsAt)}, com a formação das equipes.`
                : 'O cadastro abre com a formação das equipes.'}
            </p>
          </>
        ) : project ? (
          <>
            <p className={styles.noticeTitle}>Você está editando os dados do projeto</p>
            <p>
              As alterações valem para toda a equipe e podem ser feitas
              {deadline ? ` até ${deadline}` : ' durante a formação das equipes'}.
            </p>
          </>
        ) : (
          <>
            <p className={styles.noticeTitle}>O projeto da equipe ainda não foi cadastrado</p>
            <p>
              Preencha os dados abaixo. Salvar um rascunho não conclui a inscrição; para participar,
              finalize em Cadastrar projeto
              {deadline ? ` até ${deadline}` : ' durante a formação das equipes'}.
            </p>
          </>
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          {options.isPending || (!project && draft.isPending) ? (
            <Spinner label="Carregando o formulário…" />
          ) : !options.data || (!project && draft.data === undefined) ? (
            <LoadError
              what="o formulário do projeto"
              onRetry={() => {
                if (options.isError) void options.refetch();
                if (draft.isError) void draft.refetch();
              }}
            />
          ) : (
            <ProjectForm
              teamId={team.id}
              options={options.data}
              initialValues={fromProjectDraft(
                project ? projectToDraft(project) : draft.data,
                options.data,
              )}
              hasProject={Boolean(project)}
              savedAt={project && !isProjectIncomplete(project) ? null : draft.data?.saved_at}
              mode={project && !isProjectIncomplete(project) ? 'edit' : 'register'}
              disabled={closed || upcoming}
              onRegistered={() => navigate(TEAM_PROJECT_PATH)}
              onFormationClosed={() => setClosedByApi(true)}
            />
          )}
        </div>

        <aside className={styles.sideColumn} aria-label="Contexto da inscrição">
          <ResponsibleTeamCard team={team} />
          <BeforeRegisteringCard />
          <DeadlineCard deadline={deadline} />
          <GuidanceCard />
        </aside>
      </div>

      <Footer />
    </Page>
  );
}
