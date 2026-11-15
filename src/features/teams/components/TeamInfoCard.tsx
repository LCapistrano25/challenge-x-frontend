import { Button } from '@/shared/ui';
import type { TeamViewMode } from '../lib/my-team';
import type { Team } from '../types';
import { TeamTag } from './TeamTag';
import styles from './MyTeam.module.css';

export interface TeamFact {
  label: string;
  value: string;
}

export interface TeamInfoCardProps {
  team: Team;
  mode: TeamViewMode;
  /** Integrantes, Vagas, Pendências/Liderança e Formação (nessa ordem, como no Figma). */
  facts: TeamFact[];
  /** Só o líder edita (o botão não aparece para os demais). */
  onEdit?: () => void;
  editDisabled?: boolean;
}

const ROLE_TAG: Record<TeamViewMode, string> = {
  LEADER: 'Você é líder',
  MEMBER: 'Você é participante',
  LEADERLESS: 'Você é participante',
};

/** Figma: cartão "Informações da equipe" (551:12039 · 554:7920 · 554:8048). */
export function TeamInfoCard({ team, mode, facts, onEdit, editDisabled }: TeamInfoCardProps) {
  return (
    <section className={styles.card} aria-labelledby="my-team-name">
      <div className={styles.teamHeader}>
        <div className={styles.teamIdentity}>
          <h2 id="my-team-name" className={styles.teamName}>
            {team.name}
          </h2>
          <TeamTag tone="primary">{ROLE_TAG[mode]}</TeamTag>
          {mode === 'LEADERLESS' && <TeamTag tone="attention">Sem líder</TeamTag>}
        </div>
        {mode === 'LEADER' && onEdit && (
          <Button
            variant="secondary"
            size="large"
            className={styles.action}
            onClick={onEdit}
            disabled={editDisabled}
          >
            Editar informações
          </Button>
        )}
      </div>

      {team.description && <p className={styles.body}>{team.description}</p>}

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
