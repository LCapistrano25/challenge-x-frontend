import { Avatar, type AvatarTone } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { TeamMember } from '../types';
import styles from './TeamHome.module.css';

/** Cores dos integrantes na ordem do Figma (Situação da equipe). */
const MEMBER_TONES: AvatarTone[] = ['pink', 'blue', 'orange', 'green'];

export interface TeamMembersCardProps {
  /** Team.members do contrato (somente vínculos ativos). */
  members: TeamMember[];
  className?: string;
}

/** "Situação da equipe": integrantes com curso, destacando o líder. */
export function TeamMembersCard({ members, className }: TeamMembersCardProps) {
  const ordered = [...members].sort(
    (a, b) => Number(b.role === 'LEADER') - Number(a.role === 'LEADER'),
  );

  return (
    <section className={cn(styles.card, styles.members, className)} aria-labelledby="team-members">
      <h2 id="team-members" className={styles.title}>
        Situação da equipe
      </h2>
      <ul className={styles.memberList}>
        {ordered.map((member, index) => (
          <li key={member.id} className={styles.member}>
            <Avatar
              name={member.student.name}
              size="lg"
              tone={MEMBER_TONES[index % MEMBER_TONES.length]}
            />
            <span className={styles.personText}>
              <span className={styles.personName}>{member.student.name}</span>
              <span className={styles.personMeta}>{member.student.course.name}</span>
              {member.role === 'LEADER' && <span className={styles.personMeta}>Líder</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
