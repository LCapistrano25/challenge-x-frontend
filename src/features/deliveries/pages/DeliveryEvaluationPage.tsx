import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useParams } from 'react-router-dom';
import { getApiError } from '@/shared/lib/api-error';
import { usePageHeader } from '@/shared/lib/page-header';
import { Alert, Button, ButtonLink, IconCheckCircle, Spinner, Textarea } from '@/shared/ui';
import { EvaluationRubric } from '../components/EvaluationRubric';
import { StatusBadge } from '../components/StatusBadge';
import { SubmittedMaterial } from '../components/SubmittedMaterial';
import { useDeliveryEvaluation, usePublishEvaluation } from '../hooks/useDeliveryEvaluation';
import {
  formatDateOnly,
  formatScore,
  formatTotal,
  maxTotal,
  parseScore,
  totalScore,
  validateScores,
} from '../lib/evaluation';
import type { DeliveryEvaluationDetail } from '../types';
import styles from './DeliveryEvaluationPage.module.css';

const DASHBOARD_PATH = '/professor';
const FEEDBACK_LIMIT = 2000;

type View = 'auto' | 'published' | 'details';

const scoreText = (score: number | null) => (score === null ? '' : formatScore(score));

/**
 * Avaliação de uma entrega (Figma: Professor › Avaliação).
 * Três estados na mesma rota: preencher e publicar, confirmação e consulta somente leitura.
 */
export function DeliveryEvaluationPage() {
  const { deliveryId = '' } = useParams();
  const { data, isLoading, isError, error, refetch } = useDeliveryEvaluation(deliveryId);
  const publish = usePublishEvaluation(deliveryId);

  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [view, setView] = useState<View>('auto');
  const startedFor = useRef<string | null>(null);

  // Preenche o formulário uma vez por entrega (notas e feedback já publicados, se houver).
  useEffect(() => {
    if (!data || startedFor.current === data.id) return;
    startedFor.current = data.id;
    setValues(Object.fromEntries(data.criteria.map((c) => [c.id, scoreText(c.score)])));
    setFeedback(data.feedback ?? '');
    setView('auto');
  }, [data]);

  const published = view === 'published';
  usePageHeader(
    published ? 'Avaliação publicada com sucesso' : 'Avaliação da Entrega',
    data
      ? `Acompanhamento do curso / ${data.course} / ${data.project_name} / Etapa ${data.stage}`
      : undefined,
  );

  if (isLoading) return <Spinner label="Carregando a entrega…" />;
  if (isError || !data) {
    const notFound = getApiError(error)?.status === 404;
    return (
      <Alert
        tone="danger"
        title={notFound ? 'Entrega não encontrada' : 'Não foi possível carregar a entrega'}
        action={
          notFound ? (
            <ButtonLink to={DASHBOARD_PATH} size="small" variant="secondary">
              Voltar ao painel
            </ButtonLink>
          ) : (
            <Button size="small" variant="secondary" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          )
        }
      >
        {notFound
          ? 'Ela pode ter sido removida ou não pertence aos seus cursos.'
          : 'Verifique sua conexão e tente novamente.'}
      </Alert>
    );
  }

  const readOnly = view === 'details' || (view === 'auto' && data.status === 'EVALUATED');
  const max = data.max_score || maxTotal(data.criteria);
  const total = readOnly ? (data.total_score ?? 0) : totalScore(data.criteria, values);

  function handleScore(criterionId: string, value: string) {
    setValues((current) => ({ ...current, [criterionId]: value }));
    setErrors((current) => ({ ...current, [criterionId]: '' }));
  }

  async function handlePublish(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const found = validateScores(data!.criteria, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await publish.mutateAsync({
        scores: data!.criteria.map((c) => ({
          criterion_id: c.id,
          score: parseScore(values[c.id] ?? '') ?? 0,
        })),
        feedback: feedback.trim(),
      });
      setView('published');
    } catch (err) {
      setSubmitError(
        getApiError(err)?.message ?? 'Não foi possível publicar a avaliação. Tente novamente.',
      );
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.context}>
        <div>
          <h2>
            {data.project_name} • {data.team_name}
          </h2>
          <p>
            {data.stage_label} • Prazo: {formatDateOnly(data.deadline)} • Nota máxima:{' '}
            {formatScore(max)}
          </p>
        </div>
        <StatusBadge status={published ? 'EVALUATED' : data.status} />
      </div>

      {published ? (
        <PublishedSummary detail={data} onSeeDetails={() => setView('details')} />
      ) : (
        <div className={styles.columns}>
          <SubmittedMaterial detail={data} />
          <form className={styles.panel} onSubmit={handlePublish} noValidate>
            <div className={styles.panelHeader}>
              <h2>Rubrica da etapa</h2>
              <span className={styles.pill}>{readOnly ? 'Concluído' : 'Rascunho'}</span>
            </div>
            <p className={styles.hint}>Preencha uma nota entre 0 e o máximo de cada critério.</p>
            <EvaluationRubric
              criteria={data.criteria}
              values={values}
              errors={errors}
              readOnly={readOnly}
              onChange={handleScore}
            />
            <div className={styles.total}>
              <span>Total da avaliação</span>
              <strong aria-live="polite">{formatTotal(total, max)}</strong>
            </div>
            {readOnly ? (
              <div>
                <p className={styles.hint}>Feedback textual à equipe</p>
                <p className={styles.feedbackText}>{data.feedback || 'Sem feedback textual.'}</p>
              </div>
            ) : (
              <Textarea
                label="Feedback textual à equipe"
                value={feedback}
                maxLength={FEEDBACK_LIMIT}
                onChange={(event) => setFeedback(event.target.value)}
              />
            )}
            {!readOnly && (
              <p className={`${styles.hint} ${styles.caption}`}>
                Ao publicar, as notas e o feedback ficarão disponíveis para a equipe e a entrega
                passará para Avaliado.
              </p>
            )}
            {submitError && (
              <p role="alert" className={styles.submitError}>
                {submitError}
              </p>
            )}
            <div className={styles.actions}>
              <ButtonLink to={DASHBOARD_PATH} variant="secondary">
                Voltar ao painel
              </ButtonLink>
              {!readOnly && (
                <Button type="submit" loading={publish.isPending}>
                  {publish.isPending ? 'Publicando…' : 'Publicar avaliação'}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      <p className={styles.footer}>Desafio X / Área docente / Avaliação da entrega</p>
    </div>
  );
}

function PublishedSummary({
  detail,
  onSeeDetails,
}: {
  detail: DeliveryEvaluationDetail;
  onSeeDetails: () => void;
}) {
  const max = detail.max_score || maxTotal(detail.criteria);
  return (
    <>
      <section className={styles.success} aria-labelledby="published-title">
        <div className={styles.successHeader}>
          <span className={styles.successIcon}>
            <IconCheckCircle size={28} aria-hidden="true" />
          </span>
          <div>
            <h2 id="published-title">Avaliação publicada com sucesso</h2>
            <p>
              A nota e o feedback foram registrados e já estão visíveis para a {detail.team_name}.
            </p>
          </div>
        </div>
        <dl className={styles.summary}>
          <div>
            <dt>Projeto</dt>
            <dd>
              {detail.project_name} • {detail.team_name}
            </dd>
          </div>
          <div>
            <dt>Etapa</dt>
            <dd>{detail.stage_label}</dd>
          </div>
          <div>
            <dt>Nota publicada</dt>
            <dd>{formatTotal(detail.total_score ?? 0, max)}</dd>
          </div>
          <div>
            <dt>Feedback</dt>
            <dd>{detail.feedback ? 'Enviado para a equipe' : 'Sem feedback textual'}</dd>
          </div>
        </dl>
        <div className={styles.next}>
          <p>Próximo passo</p>
          <p>Retorne ao painel de avaliações para acompanhar as próximas etapas do projeto.</p>
        </div>
      </section>
      <div className={styles.actions}>
        <ButtonLink to={DASHBOARD_PATH} variant="secondary">
          Voltar ao painel
        </ButtonLink>
        <Button onClick={onSeeDetails}>Ver detalhes da entrega</Button>
      </div>
    </>
  );
}
