import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getApiError } from '@/shared/lib/api-error';
import { cn } from '@/shared/lib/cn';
import { Button, ButtonLink, Checkbox, Spinner, TextField, Textarea } from '@/shared/ui';
import {
  BackLink,
  DeliveredFiles,
  EvaluatorFooter,
  EvaluatorHeading,
  Notice,
  Pill,
} from '../components/EvaluatorBlocks';
import {
  CriterionReview,
  EvaluationSteps,
  FeedbackReview,
  ProjectMiniCard,
  ScoreSummary,
} from '../components/EvaluationParts';
import { IconCheckCircleOutline } from '../components/evaluator-icons';
import blocks from '../components/Evaluator.module.css';
import { useEvaluatorPage } from '../hooks/useEvaluatorPage';
import { useFinalEvaluation, useSaveFinalEvaluation } from '../hooks/useFinalEvaluation';
import { useFinalistProject, useFinalists } from '../hooks/useFinalists';
import { FINALISTS_PATH, evaluationViewPath, finalistPath } from '../lib/evaluator-paths';
import {
  FEEDBACK_KEY,
  FEEDBACK_MIN_LENGTH,
  computeTotal,
  describeConfiguration,
  describeInvalidFields,
  draftFrom,
  invalidFieldsTitle,
  scaleHint,
  scoreKey,
  sortQuestions,
  textKey,
  toWrite,
  validateDraft,
  type EvaluationDraft,
  type ScoreTotal,
} from '../lib/final-evaluation';
import { countFinalists, formatDateTime, formatScore } from '../lib/finalists';
import type {
  FinalEvaluation,
  FinalEvaluationForm,
  FinalQuestion,
  FinalistProjectDetail,
} from '../types';
import styles from './EvaluationFormPage.module.css';

type Step = 'form' | 'review' | 'sent';

type SendError = { kind: 'network' } | { kind: 'already_sent' } | { kind: 'api'; message: string };

/**
 * Avaliação do projeto finalista em duas etapas (Figma: 06 - Avaliador › "Avaliar projeto
 * finalista", "Avaliar projeto · Validação", "Revisão da avaliação", "Revisão · Erro de envio"
 * e "Confirmação de envio"). Depois do envio a avaliação é definitiva e somente leitura.
 */
export function EvaluationFormPage() {
  const { projectId = '' } = useParams();
  const edition = useEvaluatorPage();
  const { data, isLoading, isError, error, refetch } = useFinalEvaluation(projectId);
  // Equipe, integrantes e arquivos entregues vêm do detalhe do projeto (a avaliação não os traz).
  const detail = useFinalistProject(projectId).data;

  if (isLoading) return <Spinner label="Carregando o formulário de avaliação…" />;

  if (isError || !data) {
    const status = getApiError(error)?.status;
    const notAssigned = status === 404 || status === 403;
    return (
      <div className={blocks.page}>
        <BackLink to={FINALISTS_PATH}>Voltar aos projetos finalistas</BackLink>
        <Notice
          tone="danger"
          title={notAssigned ? 'Projeto não encontrado' : 'Não foi possível carregar o formulário'}
        >
          {notAssigned
            ? 'Este projeto não está atribuído à sua banca.'
            : 'Verifique sua conexão e tente novamente.'}
        </Notice>
        {!notAssigned && (
          <Button
            variant="secondary"
            size="large"
            className={styles.alignStart}
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <EvaluationFlow
      key={projectId}
      projectId={projectId}
      data={data}
      detail={detail}
      edition={edition}
    />
  );
}

function EvaluationFlow({
  projectId,
  data,
  detail,
  edition,
}: {
  projectId: string;
  data: FinalEvaluationForm;
  detail: FinalistProjectDetail | undefined;
  edition?: string;
}) {
  const questions = sortQuestions(data.form.questions);
  const saveDraft = useSaveFinalEvaluation(projectId);
  const submit = useSaveFinalEvaluation(projectId);

  const [step, setStep] = useState<Step>('form');
  // O rascunho vive na página: falha de rede ou ida e volta entre as etapas não perdem dados.
  const [draft, setDraft] = useState<EvaluationDraft>(() => draftFrom(data.evaluation));
  const [showErrors, setShowErrors] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [sendError, setSendError] = useState<SendError | null>(null);
  const [sent, setSent] = useState<FinalEvaluation | null>(null);
  const [attempted, setAttempted] = useState(false);
  const sending = useRef(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  // Cada etapa começa no topo da página.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Ao bloquear a revisão, leva o foco ao resumo dos campos a corrigir.
  useEffect(() => {
    if (showErrors) errorSummary.current?.focus();
  }, [showErrors]);

  // Avaliação já enviada antes de abrir a tela: é definitiva, só pode ser consultada.
  if (data.evaluation?.status === 'FINALIZED' && !attempted) {
    return <Navigate to={evaluationViewPath(projectId)} replace />;
  }

  const project = data.project;
  const teamName = detail?.team.name;
  const errors = validateDraft(questions, draft);
  const errorCount = Object.keys(errors).length;
  const total = computeTotal(questions, draft);
  const subtitleBase = [project.title, teamName].filter(Boolean).join(' · ');
  const configTitle = `${data.form.title ?? 'Formulário da etapa final'}${edition ? ` · Etapa final ${edition}` : ''}`;

  function update(patch: Partial<EvaluationDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleReview(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (errorCount > 0) {
      setShowErrors(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setShowErrors(false);
    setSendError(null);
    setStep('review');
    // Guarda o preenchimento ("Em preenchimento" na listagem). Se falhar, a revisão continua.
    saveDraft.mutate(toWrite(questions, draft, 'IN_PROGRESS'));
  }

  async function handleSubmit() {
    if (!confirmed || sending.current || submit.isPending) return;
    sending.current = true;
    setAttempted(true);
    setSendError(null);
    try {
      const evaluation = await submit.mutateAsync(toWrite(questions, draft, 'FINALIZED'));
      setSent(evaluation);
      setStep('sent');
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError?.code === 'final_evaluation_already_finalized') {
        setSendError({ kind: 'already_sent' });
      } else if (apiError) {
        setSendError({ kind: 'api', message: apiError.message });
      } else {
        setSendError({ kind: 'network' });
      }
    } finally {
      sending.current = false;
    }
  }

  if (step === 'sent' && sent) {
    return (
      <SentConfirmation
        projectId={projectId}
        title={project.title}
        teamName={teamName}
        edition={edition}
        evaluation={sent}
        total={total}
      />
    );
  }

  if (step === 'review') {
    const answers = new Map(
      toWrite(questions, draft, 'FINALIZED').answers.map((a) => [a.question_id, a]),
    );
    const failed = sendError?.kind === 'network';
    return (
      <div className={blocks.page}>
        <button
          type="button"
          className={cn(blocks.back, styles.linkButton)}
          onClick={() => setStep('form')}
        >
          ← Voltar ao formulário
        </button>
        <EvaluatorHeading
          edition={edition}
          title={failed ? 'Revisão · Envio não concluído' : 'Revisão da avaliação'}
          description={`${subtitleBase} · Confira os dados antes de enviar.`}
        />
        <EvaluationSteps step="review" />

        {failed && (
          <Notice tone="danger" title="Não foi possível enviar sua avaliação">
            Ocorreu uma falha de conexão. A avaliação não foi publicada e os dados preenchidos
            continuam disponíveis nesta revisão. Verifique sua conexão e tente novamente.
          </Notice>
        )}
        {sendError?.kind === 'api' && (
          <Notice tone="danger" title="Não foi possível enviar sua avaliação">
            {sendError.message}
          </Notice>
        )}
        {sendError?.kind === 'already_sent' && (
          <Notice tone="warning" title="Esta avaliação já foi enviada">
            O envio é definitivo e não pode ser repetido.{' '}
            <Link to={evaluationViewPath(projectId)}>Ver avaliação enviada</Link>
          </Notice>
        )}
        <Notice title={configTitle}>{describeConfiguration(questions)}</Notice>

        <div className={styles.columns}>
          <div className={styles.mainColumn}>
            {questions.map((question) => {
              const answer = answers.get(question.id);
              return (
                <CriterionReview
                  key={question.id}
                  question={question}
                  answer={{
                    value: answer?.value ?? null,
                    answer_text: answer?.answer_text ?? null,
                    comment: answer?.comment ?? null,
                  }}
                />
              );
            })}
            <FeedbackReview text={draft.feedback.trim()} />
          </div>

          <aside className={styles.side} aria-label="Envio da avaliação">
            <ScoreSummary total={total} status={<Pill>Pronta para revisão</Pill>} />
            <section className={blocks.card} aria-labelledby="confirm-title">
              <h2 id="confirm-title">Confirme antes de enviar</h2>
              <p className={blocks.small}>
                Você está enviando sua avaliação individual do {project.title}
                {teamName ? `, da ${teamName},` : ''} para a etapa final
                {edition ? ` de ${edition}` : ''}.
              </p>
              <Notice tone="warning" title="Após o envio, não será possível editar">
                Notas, comentários e justificativas ficarão disponíveis somente para consulta.
              </Notice>
              <Checkbox
                className={styles.confirm}
                label="Revisei as notas e os pareceres. Confirmo o envio definitivo desta avaliação."
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <Button
                size="large"
                fullWidth
                loading={submit.isPending}
                disabled={!confirmed || sendError?.kind === 'already_sent'}
                onClick={() => void handleSubmit()}
              >
                {submit.isPending
                  ? 'Enviando…'
                  : failed
                    ? 'Tentar enviar novamente'
                    : 'Confirmar e enviar avaliação'}
              </Button>
              <Button
                variant="secondary"
                size="large"
                fullWidth
                disabled={submit.isPending}
                onClick={() => setStep('form')}
              >
                Voltar e corrigir
              </Button>
              <p className={blocks.small}>
                O envio registra a pontuação total de {formatScore(total.total)} /{' '}
                {formatScore(total.max)} pontos.
              </p>
            </section>
          </aside>
        </div>

        <EvaluatorFooter edition={edition} />
      </div>
    );
  }

  const visibleErrors = showErrors ? errors : {};
  const blocked = showErrors && errorCount > 0;

  return (
    <div className={blocks.page}>
      <BackLink to={finalistPath(projectId)}>Voltar ao projeto</BackLink>
      <EvaluatorHeading
        edition={edition}
        title={blocked ? 'Avaliar projeto · Corrigir campos' : 'Avaliar projeto finalista'}
        description={`${subtitleBase} · Avaliação ainda não enviada`}
      />
      <EvaluationSteps step="form" />
      <Notice title={configTitle}>{describeConfiguration(questions)}</Notice>
      {blocked && (
        <div ref={errorSummary} tabIndex={-1} className={styles.errorSummary}>
          <Notice tone="danger" title={invalidFieldsTitle(errorCount)}>
            {describeInvalidFields(questions, draft, errors)}
          </Notice>
        </div>
      )}

      <form className={styles.form} onSubmit={handleReview} noValidate>
        <div className={styles.columns}>
          <div className={styles.mainColumn}>
            <p className={blocks.small}>
              Campos marcados com * são obrigatórios. Comentários são opcionais; justifique cada
              nota com base nas entregas.
            </p>
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                draft={draft}
                errors={visibleErrors}
                onChange={update}
              />
            ))}
            <section className={blocks.card} aria-labelledby="general-feedback">
              <h2 id="general-feedback">Feedback geral à equipe</h2>
              <Textarea
                className={cn(blocks.field, styles.feedback)}
                label="Parecer final *"
                hint={`Campo obrigatório · mínimo de ${FEEDBACK_MIN_LENGTH} caracteres`}
                rows={7}
                value={draft.feedback}
                error={visibleErrors[FEEDBACK_KEY]}
                onChange={(event) => update({ feedback: event.target.value })}
              />
            </section>
          </div>

          <aside className={styles.side} aria-label="Contexto da avaliação">
            <ProjectMiniCard project={project} teamName={teamName} to={finalistPath(projectId)} />
            {blocked && total.total === null ? (
              <Notice tone="warning" title="Total indisponível">
                Corrija os campos destacados para calcular a pontuação válida. Máximo da etapa:{' '}
                {formatScore(total.max)} pontos.
              </Notice>
            ) : (
              <ScoreSummary
                total={total}
                status={
                  total.total === null ? (
                    <Pill tone="pending">Em preenchimento</Pill>
                  ) : (
                    <Pill>Pronta para revisão</Pill>
                  )
                }
              />
            )}
            {detail && (
              <DeliveredFiles materials={detail.materials} submittedAt={detail.submitted_at} />
            )}
            <Notice title="Envio em duas etapas">
              Você poderá conferir notas e pareceres antes de confirmar. Após o envio, a avaliação
              será somente leitura.
            </Notice>
          </aside>
        </div>

        <div className={styles.actions}>
          <p className={blocks.small}>A avaliação só será enviada após a confirmação na revisão.</p>
          <ButtonLink to={finalistPath(projectId)} variant="ghost" size="large">
            Voltar ao projeto
          </ButtonLink>
          <Button type="submit" size="large" disabled={blocked}>
            Revisar avaliação
          </Button>
        </div>
      </form>

      <EvaluatorFooter edition={edition} />
    </div>
  );
}

function QuestionCard({
  question,
  draft,
  errors,
  onChange,
}: {
  question: FinalQuestion;
  draft: EvaluationDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<EvaluationDraft>) => void;
}) {
  const id = question.id;
  const setText = (value: string) => onChange({ texts: { ...draft.texts, [id]: value } });

  if (question.type === 'TEXT') {
    return (
      <section className={blocks.card} aria-labelledby={`question-${id}`}>
        <h2 id={`question-${id}`}>{question.prompt}</h2>
        {question.description && <p className={blocks.small}>{question.description}</p>}
        <Textarea
          className={blocks.field}
          label="Resposta *"
          rows={4}
          value={draft.texts[id] ?? ''}
          error={errors[textKey(id)]}
          onChange={(event) => setText(event.target.value)}
        />
      </section>
    );
  }

  return (
    <section className={blocks.card} aria-labelledby={`question-${id}`}>
      <div className={styles.criterionHeader}>
        <h2 id={`question-${id}`}>{question.prompt}</h2>
        <Pill>Máximo: {formatScore(question.max_score)} pontos</Pill>
      </div>
      {question.description && <p className={blocks.small}>{question.description}</p>}
      <div className={styles.scoreRow}>
        <TextField
          className={cn(blocks.field, styles.scoreField)}
          label="Nota atribuída *"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`Nota atribuída a ${question.prompt}`}
          value={draft.scores[id] ?? ''}
          error={errors[scoreKey(id)]}
          onChange={(event) => onChange({ scores: { ...draft.scores, [id]: event.target.value } })}
        />
        <p className={styles.scale}>
          {scaleHint(question).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
      <div className={styles.textRow}>
        <Textarea
          className={blocks.field}
          label="Comentário à equipe (opcional)"
          aria-label={`Comentário à equipe sobre ${question.prompt} (opcional)`}
          rows={4}
          value={draft.comments[id] ?? ''}
          onChange={(event) =>
            onChange({ comments: { ...draft.comments, [id]: event.target.value } })
          }
        />
        <Textarea
          className={blocks.field}
          label="Justificativa da nota *"
          aria-label={`Justificativa da nota de ${question.prompt}`}
          placeholder="Descreva as evidências..."
          rows={4}
          value={draft.texts[id] ?? ''}
          error={errors[textKey(id)]}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
    </section>
  );
}

function SentConfirmation({
  projectId,
  title,
  teamName,
  edition,
  evaluation,
  total,
}: {
  projectId: string;
  title: string;
  teamName?: string;
  edition?: string;
  evaluation: FinalEvaluation;
  total: ScoreTotal;
}) {
  const finalists = useFinalists().data?.results;
  const counters = finalists ? countFinalists(finalists) : null;

  return (
    <div className={blocks.page}>
      <EvaluatorHeading
        edition={edition}
        title="Confirmação de envio"
        description={`Sua avaliação individual foi registrada na etapa final${edition ? ` de ${edition}` : ''}.`}
      />
      <section className={styles.sent} aria-labelledby="sent-title">
        <span className={styles.sentIcon}>
          <IconCheckCircleOutline size={32} />
        </span>
        <h2 id="sent-title">Avaliação enviada com sucesso</h2>
        <p className={styles.sentLead}>
          As notas e os pareceres foram publicados. Obrigado pela sua contribuição.
        </p>
        <div className={styles.receipt}>
          <div className={styles.receiptHeader}>
            <h3>{title}</h3>
            <Pill tone="sent">Enviada</Pill>
          </div>
          <p className={blocks.small}>
            {[teamName, `Etapa final${edition ? ` ${edition}` : ''}`].filter(Boolean).join(' · ')}
          </p>
          <p className={styles.receiptScore}>
            {formatScore(total.total)} / {formatScore(total.max)} pontos
          </p>
          {evaluation.finalized_at && (
            <p className={blocks.small}>
              Enviada em {formatDateTime(evaluation.finalized_at)} · Horário de Brasília
            </p>
          )}
          <p className={blocks.small}>
            Protocolo: {evaluation.protocol ?? `#${evaluation.id}`} · Disponível somente para
            consulta
          </p>
        </div>
        <div className={styles.sentActions}>
          <ButtonLink to={FINALISTS_PATH} size="large">
            Retornar às avaliações
          </ButtonLink>
          <ButtonLink to={evaluationViewPath(projectId)} variant="secondary" size="large">
            Ver avaliação enviada
          </ButtonLink>
        </div>
        {counters && (
          <p className={cn(blocks.small, styles.progress)}>
            Agora você concluiu {counters.sent} de {counters.assigned} avaliações.{' '}
            {counters.pending === 0
              ? 'Todas as avaliações da sua banca foram enviadas.'
              : `Restam ${counters.pending} ${counters.pending === 1 ? 'projeto pendente' : 'projetos pendentes'}.`}
          </p>
        )}
      </section>
      <EvaluatorFooter edition={edition} />
    </div>
  );
}
