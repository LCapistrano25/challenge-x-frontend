import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ProjectSummaryCard,
  StageStatusTag,
  TEAM_PROJECT_PATH,
  TeamResponsibleCard,
  formatDeadline,
  type Project,
  type StageDeliverable,
  type StageTone,
} from '@/features/projects';
import styles from './Delivery.module.css';

/** Figma: "Caminho de navegação" — Projeto da equipe / etapa / tela atual. */
export function DeliveryBreadcrumb({ stageName, current }: { stageName: string; current: string }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Caminho de navegação">
      <ol>
        <li>
          <Link to={TEAM_PROJECT_PATH}>Projeto da equipe</Link>
        </li>
        <li>{stageName}</li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}

export interface StageHeaderCardProps {
  item: StageDeliverable;
  /** "Etapa 3 de 4 · AgroConecta · Conexão Verde" */
  context: string;
  status: { label: string; tone: StageTone };
}

/** Figma: cartão "Identificação da etapa" (586:7716 · 586:8217). */
export function StageHeaderCard({ item, context, status }: StageHeaderCardProps) {
  return (
    <section className={styles.card} aria-labelledby="delivery-stage-title">
      <div className={styles.stageHeader}>
        <div className={styles.stageName}>
          <p className={styles.caption}>{context}</p>
          <h2 id="delivery-stage-title" className={styles.h3}>
            {item.stage.name}
          </h2>
          {item.description && <p className={styles.text}>{item.description}</p>}
        </div>
        <div className={styles.stageDeadline}>
          <p className={styles.caption}>Prazo da etapa</p>
          <p className={`${styles.text} ${styles.strong}`}>{formatDeadline(item.stage.ends_at)}</p>
          <p className={styles.caption}>Horário de Brasília</p>
        </div>
        <StageStatusTag tone={status.tone}>{status.label}</StageStatusTag>
      </div>
    </section>
  );
}

export interface ProjectContextColumnProps {
  project: Project;
  memberNames: string[];
  teamLine: string;
  leaderName: string | null;
  contextLine: string;
  editHref?: string;
}

/** Figma: "Contexto do projeto" (416px) — cartão do projeto e equipe responsável. */
export function ProjectContextColumn({
  project,
  memberNames,
  teamLine,
  leaderName,
  contextLine,
  editHref,
}: ProjectContextColumnProps) {
  return (
    <aside className={styles.sideColumn} aria-label="Contexto do projeto">
      <ProjectSummaryCard project={project} memberNames={memberNames} editHref={editHref} />
      <TeamResponsibleCard
        teamLine={teamLine}
        leaderName={leaderName}
        advisorName={project.advisor_name}
        contextLine={contextLine}
      />
    </aside>
  );
}

export function DeliveryFooter() {
  return (
    <footer className={styles.footer}>
      <p>Desafio X · Programa de inovação acadêmica</p>
      <p>
        Horário de Brasília · <Link to="/academico/duvidas">Regulamento e ajuda</Link>
      </p>
    </footer>
  );
}

export function DeliveryPage({ children }: { children: ReactNode }) {
  return <div className={`page-flush ${styles.page}`}>{children}</div>;
}
