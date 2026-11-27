import { http } from '@/shared/lib/http';
import type {
  AdminCourse,
  AdminTeam,
  EditionEvaluator,
  EditionEvaluatorUpdate,
  EvaluatorAssignment,
  EvaluatorAssignmentItem,
  EvaluatorInvitationCreate,
  ExternalEvaluator,
  Paginated,
} from '../types';

/**
 * Avaliadores externos da edição (RF11). Contrato: docs/api/openapi.yaml (tags evaluations e
 * accounts). Convite, especialidade, status do vínculo e atribuições de equipe e etapa são
 * proposta: docs/api/propostas/editais-e-avaliadores.md (P-A1 a P-A4).
 */

/** GET /api/admin/editions/{edition_id}/evaluators — vínculos e abrangências. */
export async function fetchEditionEvaluators(editionId: number): Promise<EditionEvaluator[]> {
  const { data } = await http.get<EditionEvaluator[]>(
    `/api/admin/editions/${editionId}/evaluators`,
  );
  return data;
}

/** POST /api/admin/editions/{edition_id}/evaluators — vincula avaliador já cadastrado. */
export async function linkEditionEvaluator(
  editionId: number,
  input: { evaluator_id: number; course_id: number | null },
): Promise<EditionEvaluator> {
  const { data } = await http.post<EditionEvaluator>(
    `/api/admin/editions/${editionId}/evaluators`,
    input,
  );
  return data;
}

/**
 * PATCH /api/admin/editions/{edition_id}/evaluators/{evaluator_id} — `course_id` existe;
 * `specialty` e `active` são proposta (P-A3). `evaluator_id` é o user_id do avaliador.
 */
export async function updateEditionEvaluator(
  editionId: number,
  evaluatorId: number,
  input: EditionEvaluatorUpdate,
): Promise<EditionEvaluator> {
  const { data } = await http.patch<EditionEvaluator>(
    `/api/admin/editions/${editionId}/evaluators/${evaluatorId}`,
    input,
  );
  return data;
}

/**
 * POST /api/admin/editions/{edition_id}/evaluator-invitations (proposta P-A1). Cadastra o
 * avaliador (como POST /api/admin/external-evaluators), vincula à edição e envia o convite.
 */
export async function inviteEvaluator(
  editionId: number,
  input: EvaluatorInvitationCreate,
): Promise<EditionEvaluator> {
  const { data } = await http.post<EditionEvaluator>(
    `/api/admin/editions/${editionId}/evaluator-invitations`,
    input,
  );
  return data;
}

/** POST .../evaluators/{evaluator_id}/invitation/resend (proposta P-A2). */
export async function resendInvitation(
  editionId: number,
  evaluatorId: number,
): Promise<EditionEvaluator> {
  const { data } = await http.post<EditionEvaluator>(
    `/api/admin/editions/${editionId}/evaluators/${evaluatorId}/invitation/resend`,
  );
  return data;
}

/**
 * PUT .../evaluators/{evaluator_id}/assignments (proposta P-A4). Substitui as equipes e etapas
 * do avaliador; 409 invitation_not_accepted enquanto o convite não for aceito.
 */
export async function setEvaluatorAssignments(
  editionId: number,
  evaluatorId: number,
  items: EvaluatorAssignmentItem[],
): Promise<EvaluatorAssignment[]> {
  const { data } = await http.put<EvaluatorAssignment[]>(
    `/api/admin/editions/${editionId}/evaluators/${evaluatorId}/assignments`,
    { items },
  );
  return data;
}

/** GET /api/admin/external-evaluators — catálogo de avaliadores (busca por nome ou e-mail). */
export async function fetchExternalEvaluators(search = ''): Promise<Paginated<ExternalEvaluator>> {
  const { data } = await http.get<Paginated<ExternalEvaluator>>('/api/admin/external-evaluators', {
    params: { search: search || undefined, active: true, page_size: 50 },
  });
  return data;
}

/** GET /api/admin/teams?edition_id= — equipes da edição para a atribuição. */
export async function fetchEditionTeams(editionId: number): Promise<AdminTeam[]> {
  const { data } = await http.get<Paginated<AdminTeam>>('/api/admin/teams', {
    params: { edition_id: editionId, page_size: 100 },
  });
  return data.results;
}

/** GET /api/admin/courses?active=true — abrangência do vínculo. */
export async function fetchActiveCourses(): Promise<AdminCourse[]> {
  const { data } = await http.get<AdminCourse[]>('/api/admin/courses', {
    params: { active: true },
  });
  return data;
}
