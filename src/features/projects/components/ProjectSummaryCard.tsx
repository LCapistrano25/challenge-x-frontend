import { AvatarGroup, ButtonLink } from '@/shared/ui';
import { describeProjectCourses } from '../lib/deliverables';
import type { Project } from '../types';
import styles from './TeamProject.module.css';

export interface ProjectSummaryCardProps {
  project: Project;
  memberNames: string[];
  /** Só a liderança edita os dados cadastrais: sem o link, o botão não aparece. */
  editHref?: string;
  className?: string;
}

/** Figma: Design System › "Projeto cadastrado" (182:2860) — ODS, título, resumo e equipe. */
export function ProjectSummaryCard({
  project,
  memberNames,
  editHref,
  className,
}: ProjectSummaryCardProps) {
  const sdg = project.challenge.sdg;
  return (
    <article
      className={className ? `${styles.projectCard} ${className}` : styles.projectCard}
      aria-label={`Projeto ${project.title}`}
    >
      <div className={styles.projectCardBand}>
        <span className={styles.odsTag}>ODS {sdg.number}</span>
      </div>
      <div className={styles.projectCardBody}>
        <h2 className={styles.projectCardTitle}>{project.title}</h2>
        <p className={styles.infoRow}>
          <span>{sdg.title}</span>
          <span className={styles.dot} aria-hidden="true" />
          <span>{describeProjectCourses(project)}</span>
        </p>
        <p className={styles.body}>{project.summary}</p>
        <div className={styles.projectCardFooter}>
          <AvatarGroup names={memberNames} max={4} size="sm" />
          {editHref && (
            <ButtonLink to={editHref} variant="ghost" size="large" className={styles.editLink}>
              Editar projeto
            </ButtonLink>
          )}
        </div>
      </div>
    </article>
  );
}
