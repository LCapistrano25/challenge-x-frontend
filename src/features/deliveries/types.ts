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
