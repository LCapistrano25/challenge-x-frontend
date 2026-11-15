import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import {
  describeInterestArea,
  describeLeadership,
  describeVacancies,
  formatDayMonth,
} from '../lib/team-formation';
import type { JoinRequest, TeamListing } from '../types';
import { JoinTeamButton } from './JoinTeamButton';
import styles from './FindTeam.module.css';

export interface AvailableTeamCardProps {
  team: TeamListing;
  pendingRequest?: JoinRequest;
  blocked?: boolean;
}

/** Figma: "Equipe disponível" (551:11944) — nome, vagas, apresentação, liderança e ação. */
export function AvailableTeamCard({ team, pendingRequest, blocked }: AvailableTeamCardProps) {
  const full = team.available_slots <= 0;
  const leaderName = team.leader?.name ?? `Equipe ${team.code}`;
  const details = [
    team.interest_area ? `Área: ${describeInterestArea(team.interest_area)}` : null,
    pendingRequest
      ? `Aguardando aprovação desde ${formatDayMonth(pendingRequest.created_at)}.`
      : null,
  ].filter(Boolean);

  return (
    <li className={styles.team} aria-label={team.name}>
      <div className={styles.teamHeader}>
        <h3 className={styles.teamName}>{team.name}</h3>
        <span className={cn(styles.vacancies, full && styles.vacanciesFull)}>
          {describeVacancies(team)}
        </span>
      </div>

      {team.description && <p className={styles.text}>{team.description}</p>}

      <div className={styles.teamProfile}>
        <div className={styles.person}>
          <Avatar name={leaderName} tone="blue" />
          <div className={styles.personText}>
            <span className={styles.personName}>{leaderName}</span>
            <span className={styles.personMeta}>{describeLeadership(team)}</span>
          </div>
        </div>
        <JoinTeamButton team={team} pendingRequest={pendingRequest} blocked={blocked} />
      </div>

      {details.length > 0 && <p className={styles.caption}>{details.join(' · ')}</p>}
    </li>
  );
}
