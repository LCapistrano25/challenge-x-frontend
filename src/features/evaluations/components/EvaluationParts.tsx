import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { AvatarGroup } from '@/shared/ui';
import type { FinalAnswer, FinalQuestion, FinalistProject } from '../types';
import { formatScore } from '../lib/finalists';
import { formatSum, type ScoreTotal } from '../lib/final-evaluation';
import { Pill } from './EvaluatorBlocks';
import blocks from './Evaluator.module.css';
import styles from './EvaluationParts.module.css';

/** "1 · Preencher avaliação" e "2 · Revisar e confirmar". */
export function EvaluationSteps({ step }: { step: 'form' | 'review' }) {
  return (
    <ol className={styles.steps} aria-label="Etapas do envio">
      {step === 'form' ? (
        <>
          <li aria-current="step">
            <Pill>1 · Preencher avaliação</Pill>
          </li>
          <li className={styles.nextStep}>2 · Revisar e confirmar</li>
        </>
      ) : (
        <>
          <li>
            <Pill tone="sent">✓ Preenchimento concluído</Pill>
          </li>
          <li aria-current="step">
            <Pill>2 · Revisar e confirmar</Pill>
          </li>
        </>
      )}
    </ol>
  );
}

/** Critério com nota, comentário e justificativa, somente leitura (revisão e consulta). */
export function CriterionReview({
  question,
  answer,
}: {
  question: FinalQuestion;
  answer: Pick<FinalAnswer, 'value' | 'answer_text' | 'comment'> | undefined;
}) {
  if (question.type === 'TEXT') {
    return (
      <section className={blocks.card} aria-label={question.prompt}>
        <h2>{question.prompt}</h2>
        {question.description && <p className={blocks.small}>{question.description}</p>}
        <p className={cn(blocks.small, blocks.strong)}>{answer?.answer_text || '—'}</p>
      </section>
    );
  }
  const max = formatScore(question.max_score);
  return (
    <section className={blocks.card} aria-label={question.prompt}>
      <div className={styles.criterionHeader}>
        <h2>{question.prompt}</h2>
        <Pill>
          {formatScore(answer?.value)} / {max} pontos
        </Pill>
      </div>
      <p className={blocks.small}>
        {question.description ? `${question.description} ` : ''}Limite: 0 a {max} pontos.
      </p>
      {answer?.comment && (
        <p className={cn(blocks.small, blocks.strong)}>Comentário: {answer.comment}</p>
      )}
      <p className={blocks.small}>Justificativa: {answer?.answer_text || '—'}</p>
    </section>
  );
}

/** "Feedback geral à equipe" (somente leitura). */
export function FeedbackReview({ text }: { text: string }) {
  return (
    <section className={blocks.card} aria-labelledby="feedback-review">
      <h2 id="feedback-review">Feedback geral à equipe</h2>
      <p className={blocks.text}>{text || '—'}</p>
    </section>
  );
}

/** "Resumo da avaliação": total, soma das notas, critérios preenchidos e situação. */
export function ScoreSummary({
  title = 'Resumo da avaliação',
  total,
  status,
}: {
  title?: string;
  total: ScoreTotal;
  status: ReactNode;
}) {
  return (
    <section className={cn(blocks.card, blocks.cardSoft)} aria-labelledby="score-summary">
      <h2 id="score-summary">{title}</h2>
      <p className={styles.total} aria-live="polite">
        {total.total === null
          ? 'Total indisponível'
          : `${formatScore(total.total)} / ${formatScore(total.max)} pontos`}
      </p>
      {total.total !== null && <p className={blocks.small}>{formatSum(total)}</p>}
      <p className={blocks.small}>
        {total.filled} de {total.criteria} critérios preenchidos. Máximo configurado:{' '}
        {formatScore(total.max)} pontos.
      </p>
      <div className={styles.statusRow}>{status}</div>
    </section>
  );
}

/** Cartão "Resumo do projeto" do Design System (ODS, título, equipe, resumo e integrantes). */
export function ProjectMiniCard({
  project,
  teamName,
  to,
}: {
  project: FinalistProject;
  teamName?: string;
  to: string;
}) {
  return (
    <section className={styles.projectCard} aria-label={`Resumo do projeto ${project.title}`}>
      <div className={styles.projectBanner}>
        <span className={styles.sdgBadge}>ODS {project.sdg.number}</span>
      </div>
      <div className={styles.projectBody}>
        <h2>{project.title}</h2>
        <p className={styles.projectMeta}>
          <span>{project.sdg.title}</span>
          {teamName && (
            <>
              <span className={styles.dot} aria-hidden="true" />
              <span>{teamName}</span>
            </>
          )}
        </p>
        <p className={blocks.text}>{project.summary}</p>
        <div className={styles.projectFooter}>
          <AvatarGroup names={project.members.map((member) => member.name)} max={4} />
          <Link to={to} className={styles.projectLink}>
            Ver projeto
          </Link>
        </div>
      </div>
    </section>
  );
}
