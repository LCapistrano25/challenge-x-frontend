import { useParams } from 'react-router-dom';
import { getApiError } from '@/shared/lib/api-error';
import { Avatar, Button, ButtonLink, Spinner } from '@/shared/ui';
import {
  BackLink,
  DeliveredFiles,
  EvaluatorFooter,
  EvaluatorHeading,
  Notice,
  Pill,
  StatusPill,
} from '../components/EvaluatorBlocks';
import blocks from '../components/Evaluator.module.css';
import { useEvaluatorPage } from '../hooks/useEvaluatorPage';
import { useFinalistProject } from '../hooks/useFinalists';
import { FINALISTS_PATH, evaluationFormPath, evaluationViewPath } from '../lib/evaluator-paths';
import { describeMember, paragraphs } from '../lib/finalists';
import type { FinalEvaluationStatus, FinalistProjectDetail } from '../types';
import styles from './FinalistProjectDetailPage.module.css';

const ACTION_LABEL: Record<FinalEvaluationStatus, string> = {
  PENDING: 'Avaliar projeto',
  IN_PROGRESS: 'Continuar avaliação',
  FINALIZED: 'Ver avaliação',
};

/**
 * Detalhe do projeto finalista para a banca (Figma: 06 - Avaliador › "Detalhes do projeto").
 * Mostra o projeto, os integrantes, as informações acadêmicas e os materiais entregues.
 */
export function FinalistProjectDetailPage() {
  const { projectId = '' } = useParams();
  const edition = useEvaluatorPage();
  const { data, isLoading, isError, error, refetch } = useFinalistProject(projectId);

  if (isLoading) return <Spinner label="Carregando o projeto…" />;

  if (isError || !data) {
    const status = getApiError(error)?.status;
    const notAssigned = status === 404 || status === 403;
    return (
      <div className={blocks.page}>
        <BackLink to={FINALISTS_PATH}>Voltar aos projetos finalistas</BackLink>
        <Notice
          tone="danger"
          title={notAssigned ? 'Projeto não encontrado' : 'Não foi possível carregar o projeto'}
        >
          {notAssigned
            ? 'Este projeto não está atribuído à sua banca.'
            : 'Verifique sua conexão e tente novamente.'}
        </Notice>
        {!notAssigned && (
          <Button
            variant="secondary"
            size="large"
            className={styles.retry}
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return <ProjectDetail detail={data} edition={edition} />;
}

function ProjectDetail({ detail, edition }: { detail: FinalistProjectDetail; edition?: string }) {
  const { project, team, my_evaluation_status: status } = detail;
  const about = paragraphs(detail.description);
  const objective = paragraphs(detail.objective);
  const members =
    detail.team_members.length > 0
      ? detail.team_members.map((member) => ({ name: member.name, meta: describeMember(member) }))
      : project.members.map((member) => ({ name: member.name, meta: '' }));
  const actionTo =
    status === 'FINALIZED' ? evaluationViewPath(project.id) : evaluationFormPath(project.id);

  return (
    <div className={blocks.page}>
      <BackLink to={FINALISTS_PATH}>Voltar aos projetos finalistas</BackLink>
      <EvaluatorHeading
        edition={edition}
        title={project.title}
        description={[team.name, detail.code && `Projeto ${detail.code}`, 'Etapa final']
          .filter(Boolean)
          .join(' · ')}
      />

      <div className={styles.summary}>
        <p className={styles.summaryText}>{project.summary}</p>
        <StatusPill status={status} />
        <ButtonLink
          to={actionTo}
          variant={status === 'FINALIZED' ? 'secondary' : 'primary'}
          size="large"
        >
          {ACTION_LABEL[status]}
        </ButtonLink>
      </div>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section className={blocks.card} aria-labelledby="about-project">
            <h2 id="about-project">Sobre o projeto</h2>
            {(about.length > 0 ? about : [project.summary]).map((text) => (
              <p key={text} className={blocks.text}>
                {text}
              </p>
            ))}
            {objective.length > 0 && (
              <>
                <h2>Objetivo e resultados</h2>
                {objective.map((text) => (
                  <p key={text} className={blocks.text}>
                    {text}
                  </p>
                ))}
              </>
            )}
          </section>

          <section className={blocks.card} aria-labelledby="team-members">
            <h2 id="team-members">Integrantes da {team.name}</h2>
            <ul className={styles.members}>
              {members.map((member) => (
                <li key={member.name} className={styles.member}>
                  <Avatar name={member.name} tone="blue" />
                  <span className={styles.memberInfo}>
                    <span className={blocks.strong}>{member.name}</span>
                    {member.meta && <span>{member.meta}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.side} aria-label="Informações e entregas">
          <section className={blocks.card} aria-labelledby="academic-info">
            <h2 id="academic-info">Informações acadêmicas</h2>
            <dl className={styles.info}>
              <dt>Curso</dt>
              <dd>{project.course.name}</dd>
              <dt>Objetivo de Desenvolvimento Sustentável</dt>
              <dd className={styles.sdg}>
                <Pill>ODS {project.sdg.number}</Pill>
                <span>{project.sdg.title}</span>
              </dd>
              {detail.advisor && (
                <>
                  <dt>Orientação</dt>
                  <dd>{detail.advisor}</dd>
                </>
              )}
              {detail.technologies.length > 0 && (
                <>
                  <dt>Tecnologias</dt>
                  <dd className={styles.tags}>
                    {detail.technologies.map((tech) => (
                      <Pill key={tech}>{tech}</Pill>
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </section>

          <DeliveredFiles materials={detail.materials} submittedAt={detail.submitted_at} />
        </aside>
      </div>

      <Notice title="Projeto atribuído à sua avaliação">
        As entregas são disponibilizadas para consulta. Registre seu parecer no formulário de
        avaliação conforme os critérios da etapa.
      </Notice>

      <EvaluatorFooter edition={edition} />
    </div>
  );
}
