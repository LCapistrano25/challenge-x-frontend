import { Button } from '@/shared/ui';
import { TeamTag } from './TeamTag';
import styles from './MyTeam.module.css';

export interface ParticipationCardProps {
  /** Nome do líder ativo; null quando a equipe está sem líder. */
  leaderName: string | null;
  onLeave: () => void;
  leaveDisabled?: boolean;
  leaveHint?: string;
}

/** Figma: "Sua participação" (554:7986 · 554:8116) — visão do participante. */
export function ParticipationCard({
  leaderName,
  onLeave,
  leaveDisabled,
  leaveHint,
}: ParticipationCardProps) {
  return (
    <section className={styles.card} aria-labelledby="my-participation">
      <h2 id="my-participation" className={styles.cardTitle}>
        Sua participação
      </h2>
      <TeamTag tone="neutral">Participante</TeamTag>
      <p className={styles.text}>
        Você pode consultar as informações e os integrantes da equipe e colaborar nas entregas.
      </p>
      <div className={styles.permissions}>
        <p className={styles.permissionsTitle}>Gestão exclusiva da liderança</p>
        <p>
          {leaderName
            ? `${leaderName} é responsável pela gestão da equipe. Apenas a liderança pode alterar informações e gerenciar integrantes.`
            : 'Enquanto a equipe estiver sem líder, a gestão de integrantes permanece indisponível.'}
        </p>
      </div>
      <div className={styles.leaveBlock}>
        <p className={styles.text}>
          {leaveHint ?? 'Seus envios permanecem vinculados à equipe após a saída.'}
        </p>
        <div className={styles.leaveAction}>
          <Button
            variant="danger"
            size="large"
            className={styles.action}
            onClick={onLeave}
            disabled={leaveDisabled}
          >
            Sair da equipe
          </Button>
        </div>
      </div>
    </section>
  );
}
