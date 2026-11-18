/**
 * Envio de entrega (task #13). POST /api/projects/{project_id}/stages/{stage_id}/versions é
 * PROPOSTO (P-23, P-43): corpo multipart com `items` (JSON), `files[]` e `notes`.
 */

/** Item de `items` (string JSON): LINK leva o endereço; FILE aponta a posição em `files`. */
export type DeliverableSubmissionItem =
  { field_id: number; link: string } | { field_id: number; file_index: number };

/** Preenchimento da tela "Enviar entrega", por campo da etapa. */
export interface DeliveryFormValues {
  files: Record<number, File | null>;
  links: Record<number, string>;
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
