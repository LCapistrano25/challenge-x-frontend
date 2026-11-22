import type { CourseSummary, EditionSummary, SdgSummary } from '@/shared/types/api';

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

/* --- Notas da equipe (RF32) — GET /api/projects/{project_id}/scores --- */

/** ScoreStatus — situação da nota consolidada da etapa (enum score_status). */
export type ScoreStatus = 'PENDING' | 'PARTIAL' | 'FINALIZED';

/** StageScoreDetail — nota, médias por critério e feedbacks de uma etapa pontuada. */
export interface StageScoreDetail {
  stage: { id: number; name: string; position: number };
  /** Pontos que a etapa vale ("3.00"). */
  points_value: string;
  status: ScoreStatus;
  /** Média das avaliações finalizadas; exibida quando FINALIZED. Zero sem entrega no prazo. */
  value: string | null;
  evaluation_count: number;
  min_evaluators: number;
  deliverable_status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'NOT_DELIVERED';
  criteria: {
    criterion: { id: number; name: string };
    max_score: string;
    average: string | null;
  }[];
  feedback: {
    comment: string | null;
    items: { criterion_name: string; points: string; comment: string | null }[];
  }[];
}

/** ProjectScores */
export interface ProjectScores {
  project: { id: number; title: string };
  stages: StageScoreDetail[];
}

/* -------------------------------------------------------------------------------------------
 * Avaliador externo (tasks #17, #18 e #19)
 * Espelha docs/api/openapi.yaml (tag evaluations). Campos marcados como PROPOSTA ainda não
 * existem no contrato; estão descritos em api/README.md para aprovação do back-end.
 * ----------------------------------------------------------------------------------------- */

/** FinalEvaluationStatus (enum final_evaluation_status). */
export type FinalEvaluationStatus = 'PENDING' | 'IN_PROGRESS' | 'FINALIZED';

/** TeamRef */
export interface TeamRef {
  id: number;
  name: string;
  code: string;
}

/** PublicProject — identidade pública do projeto (sem entregas, notas ou feedbacks). */
export interface FinalistProject {
  id: number;
  edition: EditionSummary;
  title: string;
  summary: string;
  course: CourseSummary;
  sdg: SdgSummary;
  category: { id: number; name: string } | null;
  members: { name: string }[];
}

/** FinalistRow — item de GET /api/evaluator/finalists (RF42, x-status: proposed). */
export interface FinalistRow {
  project: FinalistProject;
  team: TeamRef;
  my_evaluation_status: FinalEvaluationStatus;
  /** PROPOSTA: fim do prazo de avaliação da banca (ISO 8601). Coluna "Prazo / nota". */
  evaluation_deadline?: string | null;
  /** PROPOSTA: soma das notas do avaliador, só quando FINALIZED (decimal em texto). */
  my_total_score?: string | null;
  /** PROPOSTA: pontuação máxima do formulário final (decimal em texto, ex.: "100.00"). */
  max_total_score?: string | null;
  /** PROPOSTA: data do envio definitivo (ISO 8601), só quando FINALIZED. */
  finalized_at?: string | null;
}

/** Parâmetros de GET /api/evaluator/finalists. */
export interface FinalistsQuery {
  course_id?: number;
  category_id?: number;
  page?: number;
  page_size?: number;
}

export type FinalistMaterialKind = 'FILE' | 'LINK';

/** PROPOSTA: arquivo ou link entregue pela equipe, disponível para consulta da banca. */
export interface FinalistMaterial {
  id: number;
  name: string;
  kind: FinalistMaterialKind;
  url: string;
  /** Formato do arquivo (ex.: "PDF") ou serviço do link (ex.: "Figma"). */
  format: string | null;
  size_bytes: number | null;
}

/** PROPOSTA: integrante com curso, papel e função na equipe. */
export interface FinalistMember {
  name: string;
  course: string | null;
  role: 'LEADER' | 'MEMBER';
  responsibility: string | null;
}

/**
 * PROPOSTA: GET /api/evaluator/finalists/{project_id} — detalhe do projeto para a banca.
 * O contrato atual só expõe o PublicProject (título e resumo); a tela de detalhe precisa da
 * descrição, dos integrantes e dos materiais entregues.
 */
export interface FinalistProjectDetail extends FinalistRow {
  /** Código de identificação exibido no subtítulo (ex.: "DX-2026-014"). */
  code: string | null;
  description: string | null;
  /** Objetivo e resultados. */
  objective: string | null;
  advisor: string | null;
  technologies: string[];
  team_members: FinalistMember[];
  materials: FinalistMaterial[];
  /** Data da última entrega (ISO 8601). */
  submitted_at: string | null;
}
