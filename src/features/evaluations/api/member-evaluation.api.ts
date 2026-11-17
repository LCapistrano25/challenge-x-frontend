import { http } from '@/shared/lib/http';
import type { MemberNoteCreate, MemberNoteCreated, MemberNoteSummary } from '../types';

/**
 * POST /api/teams/{team_id}/member-notes — teamsCreateMemberNote (RF33, confirmada).
 * Somente o LEADER ativo da equipe; o conteúdo não volta na resposta.
 */
export async function createMemberNote(
  teamId: number,
  input: MemberNoteCreate,
): Promise<MemberNoteCreated> {
  const { data } = await http.post<MemberNoteCreated>(`/api/teams/${teamId}/member-notes`, input);
  return data;
}

/**
 * PROPOSTA (ainda não está no openapi): GET /api/teams/{team_id}/member-notes/summary — o líder
 * consulta quais integrantes já foram avaliados, sem o conteúdo (RF33). O GET de
 * /member-notes é só de TEACHER e ADMIN (RF39).
 */
export async function fetchMemberNotesSummary(teamId: number): Promise<MemberNoteSummary[]> {
  const { data } = await http.get<MemberNoteSummary[]>(`/api/teams/${teamId}/member-notes/summary`);
  return data;
}
