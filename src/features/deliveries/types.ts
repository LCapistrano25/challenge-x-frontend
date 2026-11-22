import type { CanvasContent, SwotContent } from '@/features/projects';

/**
 * Envio de entrega (task #13 + Canvas/SWOT).
 * POST /api/projects/{project_id}/stages/{stage_id}/versions:
 * - JSON quando não há arquivos;
 * - multipart/form-data com `items` (JSON), `files[]` e `notes` quando há arquivos.
 */

export type DeliverableSubmissionItem =
  | { field_id: number; link: string }
  | { field_id: number; file_index: number }
  | { field_id: number; content: CanvasContent | SwotContent };

export interface DeliverableSubmissionJson {
  items: Exclude<DeliverableSubmissionItem, { file_index: number }>[];
  notes?: string;
}

/** Preenchimento da tela "Enviar entrega", por campo da etapa. */
export interface DeliveryFormValues {
  files: Record<number, File | null>;
  links: Record<number, string>;
  canvas?: Record<number, CanvasContent>;
  swot?: Record<number, SwotContent>;
  notes: string;
}

/** Erros por campo (chave = id do campo) e da observação. */
export type DeliveryFormErrors = Partial<Record<number | 'notes', string>>;

// ---- Painel de acompanhamento do professor ----

/** Situação da entrega do ponto de vista do professor avaliador. */
export type DeliveryStatus = 'PENDING_EVALUATION' | 'SUBMITTED' | 'EVALUATED';

export interface TeacherDelivery {
  id: string;
  project_name: string;
  team_name: string;
  course: string;
  /** Número da etapa (ex.: 2). */
  stage: number;
  /** Data e hora do envio, ISO 8601. */
  submitted_at: string;
  status: DeliveryStatus;
}

/** Painel de acompanhamento do professor (tela inicial). A lista já vem por prioridade. */
export interface TeacherDashboard {
  semester: string;
  /** Ex.: "Etapa 2 — Proposta e planejamento". */
  stage_label: string;
  /** Prazo para concluir as avaliações, AAAA-MM-DD. */
  evaluation_deadline: string;
  /** Cursos vinculados ao professor. */
  courses: string[];
  deliveries: TeacherDelivery[];
}

// ---- Avaliação de uma entrega pelo professor ----

export interface DeliveryFile {
  id: string;
  name: string;
  /** Tipo exibido, ex.: "PDF". */
  type: string;
  size_bytes: number;
  /** Papel do arquivo na entrega, ex.: "Documento principal". */
  role: string;
  download_url: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  max_score: number;
  /** Nota já publicada; `null` enquanto a entrega não foi avaliada. */
  score: number | null;
}

/** Entrega com o material enviado e a rubrica da etapa (GET /api/teacher/deliveries/{id}). */
export interface DeliveryEvaluationDetail {
  id: string;
  project_name: string;
  team_name: string;
  course: string;
  stage: number;
  /** Ex.: "Etapa 2 — Proposta e planejamento". */
  stage_label: string;
  /** Prazo da etapa, AAAA-MM-DD. */
  deadline: string;
  max_score: number;
  status: DeliveryStatus;
  submitted_by: string;
  submitted_at: string;
  files: DeliveryFile[];
  team_message: string | null;
  member_count: number;
  leader_name: string;
  criteria: EvaluationCriterion[];
  feedback: string | null;
  total_score: number | null;
}

export interface PublishEvaluationInput {
  scores: { criterion_id: string; score: number }[];
  feedback: string;
}
