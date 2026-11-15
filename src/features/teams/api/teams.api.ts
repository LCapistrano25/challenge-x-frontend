import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import { sameTeamCode } from '../lib/team-formation';
import type {
  AvailableTeamsParams,
  JoinRequest,
  RequestStatus,
  Team,
  TeamCreate,
  TeamListing,
} from '../types';

/** GET /api/teams — teamsListAvailable (RF24): equipes ativas da edição vigente com vagas. */
export async function fetchAvailableTeams(
  params: AvailableTeamsParams = {},
): Promise<Paginated<TeamListing>> {
  const { data } = await http.get<Paginated<TeamListing>>('/api/teams', { params });
  return data;
}

/**
 * POST /api/teams — teamsCreate (RF21). O criador vira LEADER e a API gera o código.
 * `interest_area` e `description` são PROPOSTA: o TeamCreate do openapi só tem `name`.
 */
export async function createTeam(input: TeamCreate): Promise<Team> {
  const { data } = await http.post<Team>('/api/teams', input);
  return data;
}

/** POST /api/teams/{team_id}/join-requests — teamsCreateJoinRequest (RF24). Sem corpo. */
export async function createJoinRequest(teamId: number): Promise<JoinRequest> {
  const { data } = await http.post<JoinRequest>(`/api/teams/${teamId}/join-requests`);
  return data;
}

/** GET /api/me/join-requests — teamsListMyJoinRequests (RF24). */
export async function fetchMyJoinRequests(status?: RequestStatus): Promise<JoinRequest[]> {
  const { data } = await http.get<JoinRequest[]>('/api/me/join-requests', {
    params: status ? { status } : undefined,
  });
  return data;
}

/**
 * PROPOSTA (ainda não está no openapi): cancelar a própria solicitação PENDING.
 * O enum RequestStatus já prevê CANCELLED, mas não há rota para o aluno cancelar.
 * Rota sugerida no mesmo padrão de /api/join-requests/{id}/respond.
 */
export async function cancelJoinRequest(joinRequestId: number): Promise<JoinRequest> {
  const { data } = await http.post<JoinRequest>(`/api/join-requests/${joinRequestId}/cancel`);
  return data;
}

/**
 * "Já tem um código?": localiza a equipe pelo código usando a busca de GET /api/teams.
 * Não há rota de consulta por código no openapi; supõe-se que `search` também procure no
 * código (confirmar com o back-end). Só equipes com vagas aparecem nessa lista, então
 * equipe lotada também resulta em null.
 */
export async function findTeamByCode(code: string): Promise<TeamListing | null> {
  const page = await fetchAvailableTeams({ search: code, page_size: 20 });
  return page.results.find((team) => sameTeamCode(team.code, code)) ?? null;
}
