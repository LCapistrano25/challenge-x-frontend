import type { CSSProperties } from 'react';
import { useDragScroll } from '@/shared/lib/use-drag-scroll';
import { AvatarGroup, ButtonLink } from '@/shared/ui';
import type { PublicProject } from '../types';
import styles from './ProjectCard.module.css';

export interface ProjectCardProps {
  project: PublicProject;
  /** Rota de detalhe. Padrão: vitrine pública (/projetos/:id). */
  href?: string;
}

/** Card da vitrine de projetos (identidade pública do projeto, RF34/RF45). */
export function ProjectCard({ project, href = `/projetos/${project.id}` }: ProjectCardProps) {
  const odsColor = { '--ods-color': `var(--color-ods${project.sdg.number})` } as CSSProperties;
  const titleId = `project-${project.id}`;

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div className={styles.band} style={odsColor}>
        <span className={styles.ods} title={project.sdg.title}>
          ODS {project.sdg.number}
        </span>
      </div>
      <div className={styles.body}>
        <h3 id={titleId} className={styles.name}>
          {project.title}
        </h3>
        <p className={styles.info}>
          <span>{project.sdg.title}</span>
          <span>{project.course.name}</span>
        </p>
        <p className={styles.description}>{project.summary}</p>
        <div className={styles.footer}>
          <AvatarGroup names={project.members.map((member) => member.name)} />
          <ButtonLink
            to={href}
            variant="ghost"
            size="large"
            className={styles.cta}
            aria-label={`Ver projeto ${project.title}`}
          >
            Ver Projeto
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

/** Lista horizontal com barra de rolagem; arrasta com o mouse ou com o dedo. */
export function ProjectCarousel({ projects }: { projects: PublicProject[] }) {
  const ref = useDragScroll<HTMLUListElement>();

  return (
    <ul ref={ref} className={styles.carousel} aria-label="Projetos da edição">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
