import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import type {
  LeadershipDecision,
  LeadershipRequest,
  MemberNote,
  RequestStatus,
  TeacherProjectRow,
} from '../types';

/** A fila de liderança do professor é curta; a tela busca tudo e filtra na página. */
export const TEACHER_PAGE_SIZE = 100;

/**
 * GET /api/teacher/leadership-requests — teamsListTeacherLeadershipRequests (RF40, confirmado).
 * Solicitações das equipes cujo desafio pertence a cursos com vínculo ativo do professor.
 */
export async function fetchTeacherLeadershipRequests(
  status?: RequestStatus,
): Promise<LeadershipRequest[]> {
  const { data } = await http.get<Paginated<LeadershipRequest>>(
    '/api/teacher/leadership-requests',
    { params: { page_size: TEACHER_PAGE_SIZE, ...(status ? { status } : {}) } },
  );
  return data.results;
}

/**
 * POST /api/leadership-requests/{id}/decide — teamsDecideLeadershipRequest (RF28/RF40,
 * confirmado). Na aprovação o solicitante vira LEADER; a recusa mantém a equipe sem líder.
 */
export async function decideLeadershipRequest(
  id: number,
  input: LeadershipDecision,
): Promise<LeadershipRequest> {
  const { data } = await http.post<LeadershipRequest>(
    `/api/leadership-requests/${id}/decide`,
    input,
  );
  return data;
}

/**
 * GET /api/teacher/projects — evaluationsListTeacherProjects (RF37, confirmado). Usado aqui
 * para listar as equipes dos cursos vinculados e escolher de qual consultar as avaliações.
 */
export async function fetchTeacherProjects(): Promise<TeacherProjectRow[]> {
  const { data } = await http.get<Paginated<TeacherProjectRow>>('/api/teacher/projects', {
    params: { page_size: TEACHER_PAGE_SIZE },
  });
  return data.results;
}

/**
 * GET /api/teams/{team_id}/member-notes — teamsListMemberNotes (RF39, confirmado). Exclusivo de
 * professor do curso e admin: as avaliações que o líder registrou sobre os integrantes.
 */
export async function fetchTeamMemberNotes(teamId: number): Promise<MemberNote[]> {
  const { data } = await http.get<MemberNote[]>(`/api/teams/${teamId}/member-notes`);
  return data;
}
