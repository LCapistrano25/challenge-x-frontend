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

/** Arquivo entregue exibido no detalhe do projeto (Figma "Detalhe do Projeto" › Arquivos). */
export interface PublicDeliverableLink {
  id: number;
  label: string;
  type: 'FILE' | 'LINK';
  href?: string | null;
  /** Ex.: "PDF · 2,4 MB" ou "Link externo · Figma". */
  meta?: string | null;
}

/** Bloco do Business Model Canvas (Figma "Detalhe do Projeto" › Business Model Canvas). */
export interface ProjectCanvasBlock {
  title: string;
  text: string;
}

/**
 * PublicProjectDetail — GET /api/public/projects/{id}. O contrato retorna o mesmo PublicProject;
 * os campos abaixo são PROPOSTA (Figma "Detalhe do Projeto"): descrição expandida, objetivo,
 * código, etapa, situação, orientação, tecnologias, arquivos e Business Model Canvas.
 */
export interface PublicProjectDetail extends PublicProject {
  /** Equipe responsável, quando conhecida (ex.: "Equipe Aurora"). */
  team?: { name: string } | null;
  keywords?: string | null;
  /** Texto longo de "Sobre o projeto" (pode ter parágrafos separados por \n\n). */
  about?: string | null;
  /** "Objetivo e resultados". */
  objective?: string | null;
  /** Código do projeto, ex.: "DX-2026-014". */
  code?: string | null;
  /** Etapa atual, ex.: "Etapa final". */
  stage_label?: string | null;
  /** Situação exibida como selo, ex.: "Em preenchimento". */
  status_label?: string | null;
  /** Nome da orientação, ex.: "Prof.ª Juliana Ribeiro". */
  advisor?: string | null;
  /** Tecnologias usadas, exibidas como selos. */
  technologies?: string[];
  /** Momento do envio dos arquivos (ISO), ex.: "2026-10-20T14:32:00". */
  submitted_at?: string | null;
  deliverables?: PublicDeliverableLink[];
  /** Business Model Canvas preenchido pelos acadêmicos (6 blocos). */
  canvas?: ProjectCanvasBlock[];
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
