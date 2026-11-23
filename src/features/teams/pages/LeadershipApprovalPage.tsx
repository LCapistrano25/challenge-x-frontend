import { usePageHeader } from '@/shared/lib/page-header';
import { LeadershipRequestsPanel } from '../components/LeadershipRequestsPanel';
import styles from './TeacherMembers.module.css';

/**
 * Liderança (Figma: 05 - Professor › Liderança, "Liderança aprovada" e "Solicitação rejeitada").
 * Fluxo de aprovação de liderança das equipes sem líder dos cursos vinculados do professor: o
 * professor aprova — e o solicitante vira líder — ou recusa a solicitação (RF28, RF40).
 */
export function LeadershipApprovalPage() {
  usePageHeader(
    'Aprovação de Liderança',
    'Análise de solicitações de substituição de liderança por abandono.',
  );

  return (
    <section className={`page-flush ${styles.page}`} aria-label="Aprovação de liderança">
      <LeadershipRequestsPanel />
      <p className={styles.footer}>Desafio X / Área docente / Semestre 2026.2</p>
    </section>
  );
}
