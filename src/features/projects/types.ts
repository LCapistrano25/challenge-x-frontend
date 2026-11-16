import type { CourseSummary, SdgSummary } from '@/shared/types/api';

/**
 * Tipos do domínio de projetos, espelhando docs/api/openapi.yaml (snake_case).
 * Campos marcados como PROPOSTA ainda não estão no contrato: o Figma pede e o front já envia.
 */

export type ProjectStatus =
  'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_EVALUATION' | 'APPROVED' | 'REJECTED';

/** ChallengeSummary — o desafio traz o curso e a ODS do projeto (RF05, RF29). */
export interface ChallengeSummary {
  id: number;
  title: string;
  course: CourseSummary;
  sdg: SdgSummary;
}

/** CategoryRef */
export interface CategoryRef {
  id: number;
  name: string;
}

/**
 * Dados descritivos do projeto que o Figma pede e o contrato ainda não tem.
 * PROPOSTA (ainda não está no openapi): ver features/projects/api/README.md.
 */
export interface ProjectDetails {
  /** "Problema identificado *" */
  problem?: string | null;
  /** "Metodologia e plano de desenvolvimento *" */
  methodology?: string | null;
  /** "Público beneficiado *" */
  target_audience?: string | null;
  /** "Local de aplicação *" */
  location?: string | null;
  /** "Docente orientadora (opcional)" */
  advisor_name?: string | null;
  /** "E-mail da orientadora" */
  advisor_email?: string | null;
  /** "Link de referência (opcional)" */
  reference_url?: string | null;
}

/** Project — GET /api/teams/{team_id}/project */
export interface Project extends ProjectDetails {
  id: number;
  team_id: number;
  edition_id: number;
  challenge: ChallengeSummary;
  category: CategoryRef | null;
  title: string;
  summary: string;
  objective: string | null;
  status: ProjectStatus;
  courses: CourseSummary[];
  created_at: string;
  updated_at: string;
}

/** ProjectWrite — PUT /api/teams/{team_id}/project (x-status: proposed, P-25). */
export interface ProjectWrite extends ProjectDetails {
  challenge_id: number;
  /** "Eixo temático *" no Figma = categoria da edição (Art. 2). */
  category_id: number;
  /** Contrato: maxLength 200. O Figma limita a 100 caracteres. */
  title: string;
  /** O Figma limita a 1.000 caracteres. */
  summary: string;
  /** "Objetivo geral *" */
  objective: string | null;
}

/**
 * PROPOSTA (ainda não está no openapi): rascunho do cadastro. Salvar o rascunho não conclui a
 * inscrição (critério de aceitação); todos os campos são opcionais e não passam pelas regras de
 * ProjectWrite. PUT/GET /api/teams/{team_id}/project/draft.
 */
export interface ProjectDraft extends ProjectDetails {
  challenge_id?: number | null;
  category_id?: number | null;
  title?: string | null;
  summary?: string | null;
  objective?: string | null;
  /** Preenchido pela API ao salvar. */
  saved_at?: string;
}

/** Item de ProjectOptions.challenges (PublicChallenge). */
export interface EligibleChallenge extends ChallengeSummary {
  description: string;
}

/** Item de ProjectOptions.categories. */
export interface ProjectCategory {
  id: number;
  name: string;
  description: string | null;
}

/** ProjectOptions — GET /api/teams/{team_id}/project/options */
export interface ProjectOptions {
  challenges: EligibleChallenge[];
  categories: ProjectCategory[];
}
