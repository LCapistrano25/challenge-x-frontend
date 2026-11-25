import { http } from '@/shared/lib/http';
import type {
  AdminEdition,
  Criterion,
  CriterionCreate,
  CriterionUpdate,
  Stage,
  StageCreate,
  StageCriteriaItem,
  StageCriterion,
  StageUpdate,
} from '../types';

/**
 * Configuração da avaliação da edição: etapas (RF07), critérios e rubricas (RF06) e a
 * pontuação dos critérios por etapa (RF08). Contrato: docs/api/openapi.yaml (tag editions).
 */

/** GET /api/admin/editions — edições e suas situações. */
export async function fetchAdminEditions(): Promise<AdminEdition[]> {
  const { data } = await http.get<AdminEdition[]>('/api/admin/editions');
  return data;
}

/** GET /api/admin/editions/{edition_id}/stages — cronograma da edição. */
export async function fetchEditionStages(editionId: number): Promise<Stage[]> {
  const { data } = await http.get<Stage[]>(`/api/admin/editions/${editionId}/stages`);
  return data;
}

/** POST /api/admin/editions/{edition_id}/stages (x-status: proposed, P-19). */
export async function createStage(editionId: number, input: StageCreate): Promise<Stage> {
  const { data } = await http.post<Stage>(`/api/admin/editions/${editionId}/stages`, input);
  return data;
}

/**
 * PATCH /api/admin/stages/{stage_id} (x-status: proposed, P-21). Sem `submission_fields`, os
 * campos de entrega da etapa continuam como estão.
 */
export async function updateStage(stageId: number, input: StageUpdate): Promise<Stage> {
  const { data } = await http.patch<Stage>(`/api/admin/stages/${stageId}`, input);
  return data;
}

/** GET /api/admin/editions/{edition_id}/criteria — critérios e rubricas da edição. */
export async function fetchEditionCriteria(editionId: number): Promise<Criterion[]> {
  const { data } = await http.get<Criterion[]>(`/api/admin/editions/${editionId}/criteria`);
  return data;
}

/** POST /api/admin/editions/{edition_id}/criteria — nome único na edição. */
export async function createCriterion(
  editionId: number,
  input: CriterionCreate,
): Promise<Criterion> {
  const { data } = await http.post<Criterion>(`/api/admin/editions/${editionId}/criteria`, input);
  return data;
}

/** PATCH /api/admin/criteria/{criterion_id} — nome, rubrica e desempate. */
export async function updateCriterion(
  criterionId: number,
  input: CriterionUpdate,
): Promise<Criterion> {
  const { data } = await http.patch<Criterion>(`/api/admin/criteria/${criterionId}`, input);
  return data;
}

/** GET /api/admin/stages/{stage_id}/criteria — matriz de avaliação da etapa. */
export async function fetchStageCriteria(stageId: number): Promise<StageCriterion[]> {
  const { data } = await http.get<StageCriterion[]>(`/api/admin/stages/${stageId}/criteria`);
  return data;
}

/**
 * PUT /api/admin/stages/{stage_id}/criteria — substitui os critérios da etapa pontuada.
 * A soma dos critérios não pode passar da pontuação máxima da etapa.
 */
export async function setStageCriteria(
  stageId: number,
  items: StageCriteriaItem[],
): Promise<StageCriterion[]> {
  const { data } = await http.put<StageCriterion[]>(`/api/admin/stages/${stageId}/criteria`, {
    items,
  });
  return data;
}
