/**
 * Tipos da avaliação de membro pelo líder (task #14), espelhando docs/api/openapi.yaml
 * (snake_case). O envio usa o contrato confirmado de observações sobre integrantes (RF33);
 * o resumo do que já foi enviado é PROPOSTA (ver api/README.md).
 */

/** MemberNoteCreate — POST /api/teams/{team_id}/member-notes */
export interface MemberNoteCreate {
  /** Vínculo (team_member) avaliado. */
  member_id: number;
  /** Texto da observação (minLength 1). Leva as notas dos critérios e o comentário. */
  content: string;
}

/** MemberNoteCreated — não retorna o conteúdo: o líder não pode visualizá-lo (RF33). */
export interface MemberNoteCreated {
  id: number;
  created_at: string;
}

/**
 * PROPOSTA (ainda não está no openapi): item de GET /api/teams/{team_id}/member-notes/summary.
 * Diz ao líder quais integrantes já têm observação enviada, sem expor o conteúdo (RF33).
 * Necessário para a situação "Enviada" e o contador "X de Y avaliações enviadas" do Figma.
 */
export interface MemberNoteSummary {
  member_id: number;
  /** Último envio (ISO 8601). */
  created_at: string;
}

/** Critérios do formulário. Exemplos do protótipo: confirmar com a equipe de requisitos. */
export type MemberCriterionId = 'COMMITMENT' | 'COLLABORATION' | 'COMMUNICATION' | 'CONTRIBUTION';

/** Nota de 1 a 5 (1 · Muito baixa … 5 · Excelente). */
export type MemberScore = 1 | 2 | 3 | 4 | 5;

/** Rascunho local da avaliação de um integrante (não é enviado até "Enviar avaliação"). */
export interface MemberEvaluationDraft {
  scores: Partial<Record<MemberCriterionId, MemberScore>>;
  comment: string;
}

/** Situação exibida na lista (Figma: Não iniciada · Em preenchimento · Enviada). */
export type MemberEvaluationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SENT';
