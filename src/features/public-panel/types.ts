import type { CourseSummary, EditionSummary, SdgSummary, StageSchedule } from '@/shared/types/api';

/** Tipos do painel público, espelhando docs/api/openapi.yaml (snake_case). */

/** PublicSdg */
export interface PublicSdg extends SdgSummary {
  description: string;
  icon: string | null;
}

/** PublicChallenge */
export interface PublicChallenge {
  id: number;
  description: string;
  course: CourseSummary;
  sdg: SdgSummary;
}

/** PublicEdition — GET /api/public/editions/current */
export interface PublicEdition {
  edition: EditionSummary;
  notice_url: string | null;
  stages: StageSchedule[];
  sdgs: PublicSdg[];
  challenges: PublicChallenge[];
}

/** Integrante na identidade pública do projeto. O contrato só garante `name`. */
export interface PublicProjectMember {
  name: string;
  /** PROPOSTA (Figma "Detalhe do Projeto"): curso e papel exibidos na lista de integrantes. */
  course?: string | null;
  role?: 'LEADER' | 'MEMBER' | null;
}

/** PublicProject — item de GET /api/public/projects */
export interface PublicProject {
  id: number;
  edition: EditionSummary;
  title: string;
  summary: string;
  course: CourseSummary;
  sdg: SdgSummary;
  category: { id: number; name: string } | null;
  members: PublicProjectMember[];
}

/** Entrega pública exibida no detalhe do projeto (Figma "Detalhe do Projeto" › Entregas). */
export interface PublicDeliverableLink {
  id: number;
  label: string;
  type: 'FILE' | 'LINK';
  href?: string | null;
}

/**
 * PublicProjectDetail — GET /api/public/projects/{id}. O contrato retorna o mesmo PublicProject;
 * os campos abaixo são PROPOSTA (Figma): resumo expandido, palavra-chave e entregas públicas.
 */
export interface PublicProjectDetail extends PublicProject {
  keywords?: string | null;
  deliverables?: PublicDeliverableLink[];
}

export interface PublicProjectsQuery {
  edition_id?: number;
  course_id?: number;
  sdg_id?: number;
  category_id?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * Notícia exibida no painel. Ainda não existe no contrato (P-35): o conteúdo vem de
 * content/news.ts até o back-end modelar.
 */
export interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  href?: string;
}
