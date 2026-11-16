import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { describeFormationDeadline } from '../lib/formation-deadline';
import { IconChatOutline, IconEventBusy, IconUserCircleFilled } from './icons';
import styles from './TeamHome.module.css';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  description: string;
}

function StatCard({ icon, title, value, description }: StatCardProps) {
  return (
    <li className={cn(styles.card, styles.stat)}>
      <div className={styles.statHeader}>
        <span className={styles.statIcon}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statDescription}>{description}</p>
    </li>
  );
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export interface TeamStatusCardsProps {
  membersCount: number;
  /**
   * Limite de integrantes da edição (Edition.max_members). O StudentDashboard ainda não traz
   * esse campo; sem ele o card mostra o total de integrantes em vez das vagas.
   */
  maxMembers?: number | null;
  pendingActions: number;
  /** Fim da etapa de formação (ISO 8601) ou null se a edição não tiver essa etapa. */
  formationDeadline: string | null;
  /** Data de referência para o cálculo do prazo (útil nos testes). */
  today?: Date;
}

/** Vagas (ou integrantes), pendências e prazo de formação da equipe. */
export function TeamStatusCards({
  membersCount,
  maxMembers,
  pendingActions,
  formationDeadline,
  today,
}: TeamStatusCardsProps) {
  const deadline = formationDeadline
    ? describeFormationDeadline(formationDeadline, today)
    : { value: '—', description: 'prazo de formação não definido' };
  const vacancies = maxMembers != null ? Math.max(0, maxMembers - membersCount) : null;

  return (
    <ul className={styles.stats} aria-label="Situação da formação da equipe">
      {vacancies != null ? (
        <StatCard
          icon={<IconUserCircleFilled />}
          title="Vagas"
          value={vacancies}
          description={plural(
            vacancies,
            'vaga disponível na equipe',
            'vagas disponíveis na equipe',
          )}
        />
      ) : (
        <StatCard
          icon={<IconUserCircleFilled />}
          title="Integrantes"
          value={membersCount}
          description={plural(membersCount, 'integrante na equipe', 'integrantes na equipe')}
        />
      )}
      <StatCard
        icon={<IconChatOutline />}
        title="Pendências"
        value={pendingActions}
        description={plural(pendingActions, 'solicitação pendente', 'solicitações pendentes')}
      />
      <StatCard
        icon={<IconEventBusy />}
        title="Prazo"
        value={deadline.value}
        description={deadline.description}
      />
    </ul>
  );
}
