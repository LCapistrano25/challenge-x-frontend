import { Button } from '@/shared/ui';
import { formatDate } from '../lib/team-formation';
import type { LeadershipRequest } from '../types';
import { IconLeadership } from './icons';
import styles from './MyTeam.module.css';

export interface LeaderlessNoticeProps {
  /** Último líder (PROPOSTA Team.previous_leader); sem ele, o texto fica genérico. */
  previousLeaderName?: string | null;
  pendingRequest: LeadershipRequest | null;
  onRequest: () => void;
  disabled?: boolean;
}

/** Figma: "Ausência de liderança" (554:8069) com o botão "Solicitar liderança" (RF28). */
export function LeaderlessNotice({
  previousLeaderName,
  pendingRequest,
  onRequest,
  disabled,
}: LeaderlessNoticeProps) {
  const who = previousLeaderName ?? 'O líder anterior';
  return (
    <section className={styles.leaderless} aria-labelledby="leaderless-title">
      <IconLeadership className={styles.leaderlessIcon} />
      <div className={styles.leaderlessText}>
        <h2 id="leaderless-title" className={styles.leaderlessTitle}>
          Sua equipe está sem líder
        </h2>
        <p className={styles.text}>
          {who} saiu da equipe sem transferir a liderança. Você continua como participante e pode
          solicitar a liderança.
        </p>
        <p className={styles.caption}>
          {pendingRequest
            ? `Solicitação enviada em ${formatDate(pendingRequest.created_at)}. Aguardando a decisão de um professor do curso.`
            : 'A solicitação não altera seu papel automaticamente.'}
        </p>
      </div>
      <Button
        size="large"
        className={styles.action}
        onClick={onRequest}
        disabled={disabled || Boolean(pendingRequest)}
      >
        {pendingRequest ? 'Solicitação enviada' : 'Solicitar liderança'}
      </Button>
    </section>
  );
}
