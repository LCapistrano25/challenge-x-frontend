import type { CourseSummary, SdgSummary, StageSchedule } from '@/shared/types/api';

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
  /**
   * PROPOSTA (ainda não está no openapi): quem fez a última edição dos dados cadastrais. O Figma
   * mostra "Última edição por Ana Maria em 16/04/2027, às 15:10".
   */
  updated_by?: { user_id: string; name: string } | null;
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

/* --- Entregas por etapa (task #13): GET /api/projects/{project_id}/deliverables --- */

/** FieldType */
export type DeliverableFieldType = 'LINK' | 'FILE';

/** DeliverableStatus — derivado (RF31, P-27): Não enviada, Enviada, Não entregue. */
export type DeliverableStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'NOT_DELIVERED';

/** DeliverableField — campo exigido na entrega da etapa. */
export interface DeliverableField {
  id: number;
  type: DeliverableFieldType;
  label: string;
  required: boolean;
  /** Formatos permitidos (somente FILE), ex.: "pdf,zip". */
  formats: string | null;
  max_size_mb: number | null;
}

/** DeliverableItem — conteúdo de um campo numa versão enviada. */
export interface DeliverableItem {
  id: number;
  field_id: number;
  type: DeliverableFieldType;
  link: string | null;
  file_url: string | null;
  file_name: string | null;
  size_bytes: number | null;
}

/** ReceiptSummary — comprovante gerado a cada envio. */
export interface ReceiptSummary {
  verification_code: string;
  file_url: string | null;
  generated_at: string;
}

/** DeliverableVersion — versão imutável da entrega. */
export interface DeliverableVersion {
  id: number;
  version_number: number;
  submitted_by: { user_id: string; name: string };
  submitted_at: string;
  notes: string | null;
  items: DeliverableItem[];
  receipt: ReceiptSummary | null;
}

/**
 * PROPOSTA (ainda não está no openapi): parecer da orientação sobre a versão enviada. O Figma
 * mostra as situações "Aprovada" e "Ajustes solicitados", o parecer e o prazo de reenvio.
 */
export interface DeliverableReview {
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  /** Versão avaliada: um envio posterior volta a ficar "Aguardando avaliação". */
  version_id: number;
  comment: string | null;
  /** Até quando a equipe pode reenviar (só em CHANGES_REQUESTED). */
  resubmission_deadline: string | null;
  reviewed_at: string;
}

/** StageDeliverable — item de GET /api/projects/{project_id}/deliverables. */
export interface StageDeliverable {
  stage: StageSchedule;
  fields: DeliverableField[];
  status: DeliverableStatus;
  official_version_id: number | null;
  /** Histórico completo, da mais recente para a mais antiga. */
  versions: DeliverableVersion[];
  /** PROPOSTA: resumo da etapa ("Relatório do problema, público e evidências iniciais."). */
  description?: string | null;
  /** PROPOSTA: orientação "O que entregar nesta etapa". */
  guidance?: string | null;
  /** PROPOSTA: parecer da orientação sobre a última versão avaliada. */
  review?: DeliverableReview | null;
}
