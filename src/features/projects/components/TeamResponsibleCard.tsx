import styles from './TeamProject.module.css';

export interface TeamResponsibleCardProps {
  /** "Conexão Verde · 4 integrantes" */
  teamLine: string;
  leaderName: string | null;
  advisorName?: string | null;
  /** "Campus sede · Edição 2027 · DX-2027-018" */
  contextLine: string;
}

/** Figma: cartão "Equipe responsável" das telas de entrega (586:7833). */
export function TeamResponsibleCard({
  teamLine,
  leaderName,
  advisorName,
  contextLine,
}: TeamResponsibleCardProps) {
  return (
    <section className={styles.card} aria-labelledby="team-responsible-title">
      <h2 id="team-responsible-title" className={styles.h3}>
        Equipe responsável
      </h2>
      <p className={`${styles.body} ${styles.strong}`}>{teamLine}</p>
      <div className={styles.fact}>
        <p className={styles.text}>Líder: {leaderName ?? 'sem líder'}</p>
        {advisorName && <p className={styles.text}>Orientadora: {advisorName}</p>}
        <p className={styles.caption}>{contextLine}</p>
      </div>
    </section>
  );
}
