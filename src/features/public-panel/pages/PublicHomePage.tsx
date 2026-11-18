import type { ReactNode } from 'react';
import {
  EditionHero,
  HelpResources,
  NEWS,
  NewsList,
  ProjectCarousel,
  useCurrentEdition,
  usePublicProjects,
} from '@/features/public-panel';
import { toTimelineSteps } from '@/shared/lib/stage-timeline';
import { Alert, Button, ButtonLink, EmptyState, Spinner, Stepper } from '@/shared/ui';
import styles from './PublicHomePage.module.css';

const PROJECTS_ON_HOME = { page_size: 4 } as const;

interface SectionQuery {
  data?: unknown;
  error: unknown;
  isLoading: boolean;
  refetch: () => unknown;
}

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

  if (query.isLoading) {
    return <Spinner label={`Carregando ${label}...`} />;
  }

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
        Verifique sua conexão e tente novamente.
      </Alert>
    );
  }

  return <>{children}</>;
}

export function PublicHomePage() {
  const currentEdition = useCurrentEdition();
  const projects = usePublicProjects(PROJECTS_ON_HOME);

  const noticeUrl = currentEdition.data?.notice_url ?? null;
  const stages = currentEdition.data?.stages ?? [];

  return (
    <div className={`page-flush ${styles.page}`}>
      <SectionState query={currentEdition} label="a edição vigente">
        {currentEdition.data && (
          <EditionHero
            edition={currentEdition.data.edition}
            noticeUrl={noticeUrl}
            description="Conheça o Desafio X, acompanhe o cronograma e descubra os projetos desta edição."
          />
        )}
      </SectionState>

      {stages.length > 0 && (
        <section className={styles.stages} aria-labelledby="stages-title">
          <h2 id="stages-title" className={styles.sectionTitle}>
            Cronograma da edição
          </h2>

          <div className={styles.timelineBox}>
            <Stepper
              variant="timeline"
              steps={toTimelineSteps(stages)}
              label="Cronograma da edição"
            />
          </div>
        </section>
      )}

      <section className={`${styles.inset} ${styles.projects}`} aria-labelledby="projects-title">
        <h2 id="projects-title" className={styles.sectionTitle}>
          Projetos em destaque
        </h2>

        <SectionState query={projects} label="os projetos">
          {projects.data && projects.data.results.length > 0 ? (
            <ProjectCarousel projects={projects.data.results.slice(0, 4)} />
          ) : (
            <EmptyState
              title="Nenhum projeto publicado ainda"
              description="Os projetos aparecerão aqui quando estiverem disponíveis."
            />
          )}
        </SectionState>

        <ButtonLink to="/projetos" size="large" className={styles.projectsAction}>
          Ver Todos
        </ButtonLink>
      </section>

      <div className={`${styles.inset} ${styles.infoRow}`}>
        <NewsList items={NEWS} className={styles.news} />

        <HelpResources rulesUrl={noticeUrl} faqHref="/login" className={styles.help} />
      </div>
    </div>
  );
}
