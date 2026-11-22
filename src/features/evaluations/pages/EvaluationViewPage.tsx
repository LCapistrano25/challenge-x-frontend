import { useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getApiError } from '@/shared/lib/api-error';
import { ButtonLink, Spinner } from '@/shared/ui';
import {
  BackLink,
  EvaluatorFooter,
  EvaluatorHeading,
  Notice,
  Pill,
} from '../components/EvaluatorBlocks';
import { CriterionReview, FeedbackReview, ScoreSummary } from '../components/EvaluationParts';
import blocks from '../components/Evaluator.module.css';
import { useEvaluatorPage } from '../hooks/useEvaluatorPage';
import { useFinalEvaluation } from '../hooks/useFinalEvaluation';
import { useFinalistProject } from '../hooks/useFinalists';
import { MY_EVALUATIONS_PATH, evaluationFormPath, finalistPath } from '../lib/evaluator-paths';
import { describeConfiguration, sortQuestions, totalFromAnswers } from '../lib/final-evaluation';
import { formatDate, formatDateTime, formatTime } from '../lib/finalists';
import styles from './EvaluationViewPage.module.css';

/**
 * Avaliação enviada, somente leitura (Figma: 06 - Avaliador › "Ver avaliação publicada").
 * Nenhum campo é editável: notas, comentários, justificativas e parecer só podem ser consultados.
 */
export function EvaluationViewPage() {
  const { projectId = '' } = useParams();
  const edition = useEvaluatorPage();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useFinalEvaluation(projectId);
  const detail = useFinalistProject(projectId).data;

  if (isLoading) return <Spinner label="Carregando a avaliação…" />;

  if (isError || !data) {
    const status = getApiError(error)?.status;
    return (
      <div className={blocks.page}>
        <BackLink to={MY_EVALUATIONS_PATH}>Voltar às minhas avaliações</BackLink>
        <Notice
          tone="danger"
          title={
            status === 404 || status === 403
              ? 'Avaliação não encontrada'
              : 'Não foi possível carregar a avaliação'
          }
        >
          {status === 404 || status === 403
            ? 'Este projeto não está atribuído à sua banca.'
            : 'Verifique sua conexão e tente novamente.'}
        </Notice>
      </div>
    );
  }

  const { project, form, evaluation } = data;
  const teamName = detail?.team.name;
  const editionLabel = edition ? ` ${edition}` : '';

  if (evaluation?.status !== 'FINALIZED') {
    return (
      <div className={blocks.page}>
        <BackLink to={MY_EVALUATIONS_PATH}>Voltar às minhas avaliações</BackLink>
        <EvaluatorHeading edition={edition} title="Ver avaliação" description={project.title} />
        <Notice tone="warning" title="Esta avaliação ainda não foi enviada">
          Só as avaliações enviadas aparecem para consulta. Conclua o preenchimento e confirme o
          envio na revisão.
        </Notice>
        <ButtonLink to={evaluationFormPath(project.id)} size="large" className={styles.alignStart}>
          {evaluation ? 'Continuar avaliação' : 'Avaliar projeto'}
        </ButtonLink>
        <EvaluatorFooter edition={edition} />
      </div>
    );
  }

  const questions = sortQuestions(form.questions);
  const answers = new Map(evaluation.answers.map((answer) => [answer.question_id, answer]));
  const total = totalFromAnswers(questions, evaluation.answers);
  const finalizedAt = evaluation.finalized_at;

  return (
    <div className={blocks.page}>
      <BackLink to={MY_EVALUATIONS_PATH}>Voltar às minhas avaliações</BackLink>
      <EvaluatorHeading
        edition={edition}
        title="Ver avaliação"
        description={[project.title, teamName, `Etapa final${editionLabel}`]
          .filter(Boolean)
          .join(' · ')}
      />
      <Notice tone="success" title="Avaliação publicada · Somente leitura">
        {finalizedAt ? `Enviada em ${formatDateTime(finalizedAt)}. ` : ''}Este registro não pode ser
        editado pelo avaliador externo.
      </Notice>
      <Notice title={`${form.title ?? 'Formulário da etapa final'} · Etapa final${editionLabel}`}>
        {describeConfiguration(questions)}
      </Notice>

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          {questions.map((question) => (
            <CriterionReview
              key={question.id}
              question={question}
              answer={answers.get(question.id)}
            />
          ))}
          <FeedbackReview text={evaluation.comment ?? ''} />
        </div>

        <aside className={styles.side} aria-label="Dados da avaliação">
          <ScoreSummary
            title="Pontuação publicada"
            total={total}
            status={<Pill tone="sent">Enviada · somente leitura</Pill>}
          />
          <section className={blocks.card} aria-labelledby="evaluation-data">
            <h2 id="evaluation-data">Dados da avaliação</h2>
            <dl className={styles.info}>
              {user && (
                <>
                  <dt>Avaliação de</dt>
                  <dd className={styles.evaluator}>
                    <span>{user.name}</span>
                    <Pill>Avaliador externo</Pill>
                  </dd>
                </>
              )}
              <dt>Projeto / equipe</dt>
              <dd>{[project.title, teamName].filter(Boolean).join(' · ')}</dd>
              <dt>Curso</dt>
              <dd>{project.course.name}</dd>
              <dt>Protocolo</dt>
              <dd>{evaluation.protocol ?? `#${evaluation.id}`}</dd>
              {finalizedAt && (
                <>
                  <dt>Envio definitivo</dt>
                  <dd>
                    {formatDate(finalizedAt)} · {formatTime(finalizedAt)}
                    <br />
                    Horário de Brasília
                  </dd>
                </>
              )}
            </dl>
            <ButtonLink to={finalistPath(project.id)} variant="secondary" size="large">
              Consultar projeto
            </ButtonLink>
          </section>
        </aside>
      </div>

      <EvaluatorFooter edition={edition} />
    </div>
  );
}
