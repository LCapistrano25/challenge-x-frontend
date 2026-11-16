import { Avatar, Button, type AvatarTone } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { describeMembersBadge, describeSlotsTitle, orderMembers } from '../lib/my-team';
import type { TeamMember } from '../types';
import { TeamTag } from './TeamTag';
import styles from './MyTeam.module.css';

/** Cores dos avatares na ordem do Figma, com o líder (rosa) primeiro. */
const MEMBER_TONES: AvatarTone[] = ['pink', 'blue', 'orange', 'green'];

export interface MyTeamMembersCardProps {
  members: TeamMember[];
  maxMembers: number;
  /** Vínculo do próprio aluno (marca "(você)"). */
  selfMemberId?: number | null;
  /** Visão do líder: "Responsável" e o botão "Remover" nos participantes. */
  manage?: boolean;
  removeDisabled?: boolean;
  onRemove?: (member: TeamMember) => void;
}

/** Figma: "Integrantes da equipe" (551:12064 · 554:7941). */
export function MyTeamMembersCard({
  members,
  maxMembers,
  selfMemberId,
  manage = false,
  removeDisabled = false,
  onRemove,
}: MyTeamMembersCardProps) {
  const ordered = orderMembers(members);
  // Sem líder, as cores continuam as mesmas de cada pessoa (o rosa era do líder).
  const offset = ordered[0]?.role === 'LEADER' ? 0 : 1;

  return (
    <section className={styles.card} aria-labelledby="my-team-members">
      <div className={styles.cardHeader}>
        <h2 id="my-team-members" className={styles.cardTitle}>
          Integrantes da equipe
        </h2>
        {!manage && <TeamTag tone="neutral">{describeMembersBadge(members.length)}</TeamTag>}
      </div>

      <ul className={cn(styles.memberList, !manage && styles.memberListReadOnly)}>
        {ordered.map((member, index) => {
          const leader = member.role === 'LEADER';
          const self = member.id === selfMemberId;
          const name = `${member.student.name}${self ? ' (você)' : ''}`;
          return (
            <li key={member.id} className={styles.member} aria-label={member.student.name}>
              <div className={styles.person}>
                <Avatar
                  name={member.student.name}
                  tone={MEMBER_TONES[(index + offset) % MEMBER_TONES.length]}
                />
                <div className={styles.personText}>
                  <span className={styles.personName}>{name}</span>
                  <span className={styles.personMeta}>{member.student.course.name}</span>
                </div>
              </div>
              <TeamTag tone={leader ? 'primary' : 'neutral'}>
                {leader ? 'Líder' : 'Participante'}
              </TeamTag>
              {manage &&
                (leader || self ? (
                  <span className={styles.memberRole}>{leader ? 'Responsável' : ''}</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="large"
                    className={styles.action}
                    onClick={() => onRemove?.(member)}
                    disabled={removeDisabled}
                    aria-label={`Remover ${member.student.name}`}
                  >
                    Remover
                  </Button>
                ))}
            </li>
          );
        })}
      </ul>

      <div className={styles.slots}>
        <p className={styles.slotsTitle}>{describeSlotsTitle(members.length, maxMembers)}</p>
        <p>
          A equipe pode ter até {maxMembers} integrantes. Convites enviados não reservam vagas até
          serem aceitos.
        </p>
      </div>
    </section>
  );
}
