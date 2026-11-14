/**
 * Tipos compartilhados do contrato da API (docs/api/openapi.yaml → components/schemas).
 * Mantêm os nomes de campos da API (snake_case). Tipos de um único domínio ficam na feature.
 */

/** Envelope de listas paginadas (PaginatedXxx). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type EditionStatus = 'SETUP' | 'PUBLISHED' | 'IN_PROGRESS' | 'CLOSED';

/** EditionSummary */
export interface EditionSummary {
  id: number;
  year: number;
  semester: 1 | 2;
  name: string | null;
  status: EditionStatus;
}

/** CourseSummary */
export interface CourseSummary {
  id: number;
  name: string;
  slug: string;
}

/** SdgSummary (ODS) */
export interface SdgSummary {
  id: number;
  number: number;
  title: string;
}

export type StageType = 'FORMATION' | 'EVALUATION' | 'FINAL';

/** Status derivado das datas da etapa (RF44). */
export type PhaseStatus = 'UPCOMING' | 'OPEN' | 'FINISHED';

/** StageSchedule */
export interface StageSchedule {
  id: number;
  position: number;
  name: string;
  type: StageType;
  /** ISO 8601 */
  starts_at: string;
  /** ISO 8601 */
  ends_at: string;
  scored: boolean;
  /** Decimal em texto, ex.: "3.00". */
  points_value: string | null;
  phase_status: PhaseStatus;
}
