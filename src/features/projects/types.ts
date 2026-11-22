import type { CourseSummary, SdgSummary, StageSchedule } from '@/shared/types/api';

/**
 * Tipos do domínio de projetos, espelhando docs/api/openapi.yaml (snake_case).
 */

export type ProjectStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISQUALIFIED'
  | 'SUBMITTED'
  | 'UNDER_EVALUATION'
  | 'APPROVED'
  | 'REJECTED';

/** ChallengeSummary — o desafio traz o curso e a ODS do projeto (RF05, RF29). */
export interface ChallengeSummary {
  id: number;
  description: string;
  course: CourseSummary;
  sdg: SdgSummary;
}

/** CategoryRef */
export interface CategoryRef {
  id: number;
  name: string;
}

/**
 * Dados descritivos opcionais de exibição no frontend.
 */
export interface ProjectDetails {
  problem?: string | null;
  methodology?: string | null;
  target_audience?: string | null;
  location?: string | null;
  advisor_name?: string | null;
  advisor_email?: string | null;
  reference_url?: string | null;
}

/** Project — GET /api/teams/{team_id}/project */
export interface Project extends ProjectDetails {
  id: number;
  team_id: number;
  edition_id: number;
  challenge: ChallengeSummary | null;
  category: CategoryRef | null;
  title: string;
  summary: string;
  objective: string;
  status: ProjectStatus;
  courses: CourseSummary[];
  created_at: string;
  updated_at: string;
  updated_by?: { user_id: string; name: string } | null;
}

/** Passo 1: PUT /api/teams/{team_id}/project/challenge (RF29). */
export interface ProjectChallengeInput {
  challenge_id: number;
}

/** Passo 2: PUT /api/teams/{team_id}/project/details (RF30). */
export interface ProjectDetailsInput {
  title: string;
  summary: string;
  objective?: string;
}

/** Passo 3: PUT /api/teams/{team_id}/project/category (RF30, RF49). */
export interface ProjectCategoryInput {
  category_id: number;
}

/** Dados combinados do formulário para salvar os passos em ordem. */
export interface ProjectWrite {
  challenge_id: number;
  category_id: number;
  title: string;
  summary: string;
  objective: string;
}

export interface ProjectDraft extends ProjectDetails {
  challenge_id?: number | null;
  category_id?: number | null;
  title?: string | null;
  summary?: string | null;
  objective?: string | null;
  saved_at?: string;
}

/** Item de ProjectOptions.challenges (PublicChallenge). */
export type EligibleChallenge = ChallengeSummary;

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

/* --- Entregas por etapa (task #13 + Canvas/SWOT): GET /api/projects/{project_id}/deliverables --- */

/** FieldType */
export type DeliverableFieldType = 'LINK' | 'FILE' | 'CANVAS' | 'SWOT';

/** DeliverableStatus — derivado (RF31, P-27): Não enviada, Enviada, Não entregue. */
export type DeliverableStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'NOT_DELIVERED';

/** CanvasContent — 9 blocos obrigatórios do Business Model Canvas. */
export interface CanvasContent {
  customer_segments: string;
  value_propositions: string;
  channels: string;
  customer_relationships: string;
  revenue_streams: string;
  key_resources: string;
  key_activities: string;
  key_partnerships: string;
  cost_structure: string;
}

/** SwotContent — 4 quadrantes com 1 a 20 textos cada. */
export interface SwotContent {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

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
  field_id: number | null;
  type: DeliverableFieldType;
  link: string | null;
  file_url: string | null;
  file_name: string | null;
  size_bytes: number | null;
  content?: CanvasContent | SwotContent | null;
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

export interface DeliverableReview {
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  version_id: number;
  comment: string | null;
  resubmission_deadline: string | null;
  reviewed_at: string;
}

/** StageDeliverable — item de GET /api/projects/{project_id}/deliverables. */
export interface StageDeliverable {
  stage: StageSchedule;
  fields: DeliverableField[];
  status: DeliverableStatus;
  official_version_id: number | null;
  versions: DeliverableVersion[];
  description?: string | null;
  guidance?: string | null;
  review?: DeliverableReview | null;
}
