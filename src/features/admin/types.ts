/**
 * Tipos da configuração da avaliação (RF06, RF07, RF08), no formato de docs/api/openapi.yaml.
 * Decimais chegam como string ("3.00"); a conversão para número fica em lib/score.ts.
 */

/** EditionStatus (área administrativa). */
export type AdminEditionStatus = 'SETUP' | 'PUBLISHED' | 'CLOSED';

/** Edition (GET /api/admin/editions). */
export interface AdminEdition {
  id: number;
  year: number;
  semester: 1 | 2;
  name: string | null;
  status: AdminEditionStatus;
  regulation_url: string | null;
  min_members: number;
  max_members: number;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** StageType: FINAL não compõe a nota de 0 a 10 (P-20). */
export type StageKind = 'FORMATION' | 'SUBMISSION' | 'FINAL';

/** FieldType dos campos de entrega da etapa. */
export type DeliverableFieldKind = 'LINK' | 'FILE' | 'CANVAS' | 'SWOT';

/** DeliverableField (somente leitura nesta tela; a edição dos campos é outra task). */
export interface DeliverableField {
  id: number;
  kind: DeliverableFieldKind;
  label: string;
  required: boolean;
  formats: string | null;
  max_size_mb: number | null;
}

/** Stage */
export interface Stage {
  id: number;
  edition_id: number;
  order: number;
  name: string;
  kind: StageKind;
  starts_at: string;
  ends_at: string;
  /** Prazo da avaliação dos professores; obrigatório em etapa pontuada (P-19). */
  evaluation_ends_at: string | null;
  scored: boolean;
  max_score: string | null;
  min_evaluations: number;
  submission_fields: DeliverableField[];
  created_at: string;
  updated_at: string;
}

/** StageCreate (POST /api/admin/editions/{edition_id}/stages, x-status: proposed). */
export interface StageCreate {
  order: number;
  name: string;
  kind: StageKind;
  starts_at: string;
  ends_at: string;
  evaluation_ends_at: string | null;
  scored: boolean;
  max_score: string | null;
}

/** StageUpdate (PATCH /api/admin/stages/{stage_id}, x-status: proposed). */
export type StageUpdate = Partial<StageCreate>;

/** Criterion: `rubric` guarda a descrição e as faixas de desempenho (ver lib/rubric.ts). */
export interface Criterion {
  id: number;
  edition_id: number;
  name: string;
  rubric: string | null;
  tiebreak_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface CriterionCreate {
  name: string;
  rubric?: string | null;
  tiebreak_order?: number | null;
}

export type CriterionUpdate = Partial<CriterionCreate>;

/** StageCriterion: vínculo do critério com a etapa e sua pontuação máxima. */
export interface StageCriterion {
  id: number;
  criterion: { id: number; name: string };
  max_score: string;
}

/** StageCriteriaUpdate (PUT /api/admin/stages/{stage_id}/criteria): conjunto completo. */
export interface StageCriteriaItem {
  criterion_id: number;
  max_score: string;
}
