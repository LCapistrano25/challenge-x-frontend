import { Button } from '@/shared/ui';
import styles from './MyTeam.module.css';

export interface LeaderPermissionsCardProps {
  onTransfer: () => void;
  onLeave: () => void;
  /** Sem outro integrante não há para quem transferir. */
  transferDisabled?: boolean;
  leaveDisabled?: boolean;
}

/** Figma: "Permissões e participação" (551:12121) — visão do líder. */
export function LeaderPermissionsCard({
  onTransfer,
  onLeave,
  transferDisabled,
  leaveDisabled,
}: LeaderPermissionsCardProps) {
  return (
    <section className={styles.card} aria-labelledby="leader-permissions">
      <h2 id="leader-permissions" className={styles.cardTitle}>
        Permissões e participação
      </h2>
      <p className={styles.text}>
        Como líder, você pode editar a equipe, convidar e remover integrantes, aprovar solicitações
        e cadastrar o projeto. Participantes podem consultar os dados e colaborar nas entregas, sem
        gerenciar integrantes.
      </p>
      <div className={styles.row}>
        <p className={styles.text}>
          Para sair da equipe, transfira a liderança a outro integrante.
        </p>
        <Button
          variant="secondary"
          size="large"
          className={styles.action}
          onClick={onTransfer}
          disabled={transferDisabled}
        >
          Transferir liderança
        </Button>
      </div>
      <div className={styles.row}>
        <p className={styles.caption}>Seus envios permanecem vinculados à equipe após a saída.</p>
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
    </section>
  );
}
