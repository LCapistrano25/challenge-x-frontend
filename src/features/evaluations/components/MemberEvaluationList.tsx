import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { TeamMember } from '@/features/teams';
import {
  STATUS_LABEL,
  STATUS_TONE,
  describeProgress,
  memberTone,
  progressPercent,
} from '../lib/member-evaluation';
import type { MemberEvaluationStatus } from '../types';
import { EvaluationTag } from './EvaluationTag';
import styles from './MemberEvaluation.module.css';

export interface MemberEvaluationListProps {
  /** Integrantes avaliáveis (sem o próprio líder), na ordem de entrada. */
  members: TeamMember[];
  statuses: Record<number, MemberEvaluationStatus>;
  selectedId: number | null;
  onSelect: (memberId: number) => void;
}

/** Figma: "Avaliações da equipe" (554:8185) — progresso e seleção de integrante. */
export function MemberEvaluationList({
  members,
  statuses,
  selectedId,
  onSelect,
}: MemberEvaluationListProps) {
  const sent = members.filter((member) => statuses[member.id] === 'SENT').length;
  const progress = describeProgress(sent, members.length);

  return (
    <section className={styles.card} aria-labelledby="member-evaluation-list">
      <h2 id="member-evaluation-list" className={styles.cardTitle}>
        Integrantes para avaliar
      </h2>

      <div className={styles.progress}>
        <p className={styles.text} aria-live="polite">
          {progress}
        </p>
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-label="Avaliações enviadas"
          aria-valuemin={0}
          aria-valuemax={members.length}
          aria-valuenow={sent}
          aria-valuetext={progress}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent(sent, members.length)}%` }}
          />
        </div>
      </div>

      <ul className={styles.memberList}>
        {members.map((member, index) => {
          const status = statuses[member.id] ?? 'NOT_STARTED';
          const selected = member.id === selectedId;
          return (
            <li key={member.id}>
              <button
                type="button"
                className={cn(styles.member, selected && styles.memberSelected)}
                aria-pressed={selected}
                aria-label={`${member.student.name}, ${STATUS_LABEL[status]}`}
                onClick={() => onSelect(member.id)}
              >
                <span className={styles.person}>
                  <Avatar name={member.student.name} tone={memberTone(index)} />
                  <span className={styles.personText}>
                    <span className={styles.personName}>{member.student.name}</span>
                    <span className={styles.personMeta}>{member.student.course.name}</span>
                  </span>
                </span>
                <EvaluationTag tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</EvaluationTag>
              </button>
            </li>
          );
        })}
      </ul>

      <p className={styles.caption}>
        Selecione um integrante para preencher a avaliação. Sua própria avaliação não faz parte
        desta lista.
      </p>
    </section>
  );
}
