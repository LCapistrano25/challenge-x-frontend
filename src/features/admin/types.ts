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

/* ------------------------------------------------------------------------------------------ */
/* Editais (RF09) — contrato proposto: docs/api/propostas/editais-e-avaliadores.md             */
/* ------------------------------------------------------------------------------------------ */

/** Situação da versão do edital: minuta, publicada ou substituída por uma versão mais nova. */
export type RegulationStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';

/** Edição resumida, como em EditionSummary. */
export interface EditionRef {
  id: number;
  year: number;
  semester: 1 | 2;
  name: string | null;
  status: AdminEditionStatus;
}

export interface RegulationFile {
  name: string;
  size_bytes: number;
  /** Download autenticado do PDF (GET). */
  url: string;
}

/** Versão de edital (proposta). A versão publicada nunca é alterada. */
export interface Regulation {
  id: number;
  edition: EditionRef;
  title: string;
  description: string;
  version: number;
  status: RegulationStatus;
  file: RegulationFile;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: { id: number; name: string } | null;
}

/* ------------------------------------------------------------------------------------------ */
/* Avaliadores externos (RF11)                                                                 */
/* ------------------------------------------------------------------------------------------ */

/** Convite à edição (proposta). */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface EvaluatorInvitation {
  status: InvitationStatus;
  sent_at: string;
  responded_at: string | null;
  sent_by: { id: number; name: string } | null;
}

/**
 * EditionEvaluator (GET /api/admin/editions/{edition_id}/evaluators). Os campos marcados
 * "proposta" ainda não existem na API.
 */
export interface EditionEvaluator {
  id: number;
  edition_id: number;
  evaluator: {
    user_id: number;
    name: string;
    email: string;
    institution: string | null;
    /** proposta */
    phone?: string | null;
    /** proposta */
    role_title?: string | null;
  };
  /** null = abrangência em todos os cursos da edição. */
  course: { id: number; name: string } | null;
  /** proposta */
  specialty?: string | null;
  /** proposta: vínculo ativo na edição. */
  active?: boolean;
  /** proposta */
  invitation?: EvaluatorInvitation;
  /** proposta: equipes e etapas atribuídas. */
  assignments?: EvaluatorAssignment[];
  created_at: string;
  updated_at: string;
}

/** Atribuição de equipe e etapa ao avaliador (proposta). */
export interface EvaluatorAssignment {
  id: number;
  team: { id: number; name: string };
  project: { id: number; title: string } | null;
  stage: { id: number; name: string };
}

export interface EvaluatorAssignmentItem {
  team_id: number;
  stage_id: number;
}

/** Convite de avaliador à edição (proposta: cria o usuário sem senha e envia o convite). */
export interface EvaluatorInvitationCreate {
  name: string;
  email: string;
  phone: string | null;
  institution: string;
  role_title: string | null;
  specialty: string;
  message: string | null;
}

/** PATCH do vínculo: course_id existe; specialty e active são proposta. */
export interface EditionEvaluatorUpdate {
  course_id?: number | null;
  specialty?: string | null;
  active?: boolean;
}

/** ExternalEvaluatorAdmin (GET /api/admin/external-evaluators). */
export interface ExternalEvaluator {
  user_id: number;
  name: string;
  email: string;
  active: boolean;
  institution: string | null;
  editions: { edition: EditionRef; course: { id: number; name: string } | null }[];
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** AdminTeamListItem (GET /api/admin/teams). */
export interface AdminTeam {
  id: number;
  edition_id: number;
  name: string;
  code: string;
  status: string;
  situation: string;
  member_count: number;
  project: { id: number; title: string } | null;
}

/** Course (GET /api/admin/courses). */
export interface AdminCourse {
  id: number;
  name: string;
  term_count: number;
  active: boolean;
}
