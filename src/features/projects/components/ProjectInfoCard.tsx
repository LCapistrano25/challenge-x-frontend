import type { ProjectMetric } from '../lib/deliverables';
import { PROJECT_STATUS_LABEL, describeProjectHistory } from '../lib/deliverables';
import type { Project } from '../types';
import { StageStatusTag } from './StageStatusTag';
import styles from './TeamProject.module.css';

export interface ProjectInfoCardProps {
  project: Project;
  /** "Conexão Verde · 4 integrantes" */
  teamLine: string;
  /** "Líder: Ana Maria · Orientadora: Profa. Carla Mendes" */
  responsibleLine: string;
  /** "Campus sede · Edição 2027 · DX-2027-018" */
  contextLine: string;
  metrics: ProjectMetric[];
}

/** Figma: cartão de dados do projeto (551:12454) — equipe, eixo, indicadores e histórico. */
export function ProjectInfoCard({
  project,
  teamLine,
  responsibleLine,
  contextLine,
  metrics,
}: ProjectInfoCardProps) {
  const status = project.status;
  return (
    <section className={`${styles.card} ${styles.infoCard}`} aria-labelledby="project-info-title">
      <div className={styles.cardHeader}>
        <h2 id="project-info-title" className={styles.h3}>
          {project.title}
        </h2>
        <StageStatusTag tone={status === 'REJECTED' ? 'danger' : 'positive'}>
          {PROJECT_STATUS_LABEL[status]}
        </StageStatusTag>
      </div>

      <div className={styles.columns2}>
        <div className={styles.fact}>
          <p className={styles.text}>Equipe responsável</p>
          <p className={`${styles.body} ${styles.strong}`}>{teamLine}</p>
          <p className={styles.text}>{responsibleLine}</p>
        </div>
        <div className={styles.fact}>
          <p className={styles.text}>Eixo temático</p>
          <p className={`${styles.body} ${styles.strong}`}>
            {project.category?.name ?? 'Não informado'}
          </p>
          <p className={styles.text}>{contextLine}</p>
        </div>
      </div>

      <div className={styles.divider} />

      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.caption}>{describeProjectHistory(project)}</p>
    </section>
  );
}
