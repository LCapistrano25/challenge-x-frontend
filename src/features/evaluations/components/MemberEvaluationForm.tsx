import { useId, type FormEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import { Avatar, Button, type AvatarTone } from '@/shared/ui';
import type { TeamMember } from '@/features/teams';
import {
  MEMBER_CRITERIA,
  MEMBER_SCORES,
  SCORE_LABEL,
  describeSubmission,
  isDraftComplete,
} from '../lib/member-evaluation';
import type {
  MemberCriterionId,
  MemberEvaluationDraft,
  MemberNoteSummary,
  MemberScore,
} from '../types';
import { EvaluationTag } from './EvaluationTag';
import styles from './MemberEvaluation.module.css';

const formatSentDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export interface MemberEvaluationFormProps {
  member: TeamMember;
  tone: AvatarTone;
  draft: MemberEvaluationDraft;
  /** Envio já registrado (resumo PROPOSTO). O conteúdo não pode ser consultado (RF33). */
  sent: MemberNoteSummary | null;
  onChange: (draft: MemberEvaluationDraft) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

/** Figma: "Formulário de avaliação" (554:8226) — critérios de 1 a 5, comentário e envio. */
export function MemberEvaluationForm({
  member,
  tone,
  draft,
  sent,
  onChange,
  onSubmit,
  submitting = false,
}: MemberEvaluationFormProps) {
  const formId = useId();
  const name = member.student.name;
  const complete = isDraftComplete(draft);

  function setScore(criterion: MemberCriterionId, score: MemberScore) {
    onChange({ ...draft, scores: { ...draft.scores, [criterion]: score } });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (complete && !submitting) onSubmit();
  }

  return (
    <section className={styles.card} aria-labelledby={`${formId}-member`}>
      <div className={styles.formHeader}>
        <Avatar name={name} tone={tone} />
        <div className={styles.formMember}>
          <h2 id={`${formId}-member`}>{name}</h2>
          <p className={styles.caption}>
            {member.student.course.name} · {member.role === 'LEADER' ? 'Líder' : 'Participante'}
          </p>
        </div>
        {sent ? (
          <EvaluationTag tone="positive">Enviada</EvaluationTag>
        ) : (
          <EvaluationTag tone="neutral">Ainda não enviada</EvaluationTag>
        )}
      </div>

      {sent ? (
        <div className={styles.sent} role="status">
          <p className={styles.sentTitle}>Avaliação enviada em {formatSentDate(sent.created_at)}</p>
          <p className={styles.text}>
            As notas e o comentário ficam disponíveis apenas para os professores responsáveis e a
            organização do Desafio X.
          </p>
        </div>
      ) : (
        <form
          className={styles.formBody}
          onSubmit={handleSubmit}
          aria-label={`Avaliação de ${name}`}
        >
          <div className={styles.scale}>
            <p className={styles.scaleTitle}>Como avaliar</p>
            <p className={styles.text}>
              Selecione uma nota de 1 a 5 para cada critério, considerando a participação nas
              atividades.
            </p>
            <ul className={styles.scaleLegend} aria-label="Escala de notas">
              {MEMBER_SCORES.map((score) => (
                <li key={score}>
                  {score} · {SCORE_LABEL[score]}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.criteria}>
            {MEMBER_CRITERIA.map((criterion) => {
              const labelId = `${formId}-${criterion.id}`;
              const value = draft.scores[criterion.id];
              return (
                <div key={criterion.id} className={styles.criterion}>
                  <div className={styles.criterionText}>
                    <span id={labelId} className={styles.criterionLabel}>
                      {criterion.label}
                    </span>
                    <span className={styles.caption}>{criterion.description}</span>
                  </div>
                  <div className={styles.scores} role="radiogroup" aria-labelledby={labelId}>
                    {MEMBER_SCORES.map((score) => (
                      <label
                        key={score}
                        className={cn(styles.score, value === score && styles.scoreSelected)}
                      >
                        <input
                          type="radio"
                          name={labelId}
                          value={score}
                          checked={value === score}
                          onChange={() => setScore(criterion.id, score)}
                          aria-label={`${score} · ${SCORE_LABEL[score]}`}
                        />
                        <span aria-hidden="true">{score}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.comment}>
            <label htmlFor={`${formId}-comment`} className={styles.commentLabel}>
              Comentários sobre a participação
            </label>
            <textarea
              id={`${formId}-comment`}
              className={styles.commentInput}
              rows={3}
              value={draft.comment}
              onChange={(event) => onChange({ ...draft, comment: event.target.value })}
              aria-describedby={`${formId}-comment-hint`}
            />
            <p id={`${formId}-comment-hint`} className={styles.caption}>
              Use exemplos das atividades para contextualizar suas notas.
            </p>
          </div>

          <div className={styles.submit}>
            <p className={styles.caption} aria-live="polite">
              {describeSubmission(draft, name)}
            </p>
            <Button
              type="submit"
              size="large"
              className={styles.action}
              disabled={!complete}
              loading={submitting}
            >
              Enviar avaliação
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
