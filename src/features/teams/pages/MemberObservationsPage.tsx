import { usePageHeader } from '@/shared/lib/page-header';
import { MemberNotesPanel } from '../components/MemberNotesPanel';
import styles from './TeacherMembers.module.css';

/**
 * Avaliar integrante (Figma: 05 - Professor › "Avaliar integrante" / "Verificar avaliação").
 * O professor consulta as avaliações de participação que a liderança de cada equipe registrou
 * sobre os integrantes. Exclusivo de professor do curso e admin (RF39).
 */
export function MemberObservationsPage() {
  usePageHeader(
    'Observações sobre Integrantes',
    'Consulta dos registros dos líderes sobre os integrantes das equipes do curso.',
  );

  return (
    <section className={`page-flush ${styles.page}`} aria-label="Observações sobre integrantes">
      <MemberNotesPanel />
      <p className={styles.footer}>
        Desafio X / Área docente / Semestre 2026.2 / Dados ilustrativos
      </p>
    </section>
  );
}
