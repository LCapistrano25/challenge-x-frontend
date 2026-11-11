// features/projects/components/ProjectCard.tsx
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import styles from './ProjectCard.module.css';

export type ProjectCardData = {
  id: string;
  title: string;
  summary: string;
  coverUrl?: string;
  odsNumbers: number[]; // 1 a 17
  teamName: string;
  course?: string;
  status?: 'FINALIST' | 'IN_PROGRESS' | 'SUBMITTED';
};

type ProjectCardProps = {
  project: ProjectCardData;
  to: string; // cada perfil aponta para uma rota diferente
  actions?: React.ReactNode; // ex.: botão "Avaliar" no perfil avaliador
  className?: string;
};

export function ProjectCard({ project, to, actions, className }: ProjectCardProps) {
  return (
    <article className={cn(styles.card, className)}>
      {project.coverUrl && (
        <img className={styles.cover} src={project.coverUrl} alt="" loading="lazy" />
      )}
      <div className={styles.body}>
        <ul className={styles.ods} aria-label="ODS do projeto">
          {project.odsNumbers.map((n) => (
            <li key={n} style={{ background: `var(--color-ods${n})` }}>
              ODS {n}
            </li>
          ))}
        </ul>
        <h3>
          <Link to={to}>{project.title}</Link>
        </h3>
        <p className={styles.summary}>{project.summary}</p>
        <p className={styles.meta}>
          {project.teamName}
          {project.course && ` · ${project.course}`}
        </p>
      </div>
      {actions && <footer className={styles.actions}>{actions}</footer>}
    </article>
  );
}
