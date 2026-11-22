import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import { sameTeamCode } from '../lib/team-formation';
import type {
  AvailableTeamsParams,
  Invitation,
  InvitationResponse,
  InvitationStatus,
  JoinRequest,
  RequestStatus,
  Team,
  TeamCreate,
  TeamListing,
} from '../types';

type RawTeamListing = Partial<TeamListing> & {
  id: number;
  name: string;
  code: string;
  members_count?: number;
  available_vacancies?: number;
};

function normalizeTeamListing(item: RawTeamListing): TeamListing {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    member_count: item.member_count ?? item.members_count ?? 0,
    available_slots: item.available_slots ?? item.available_vacancies ?? 0,
    courses: Array.isArray(item.courses) ? item.courses : [],
    description: item.description ?? null,
    interest_area: item.interest_area ?? null,
    leader: item.leader ?? null,
  };
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** GET /api/teams — teamsListAvailable (RF24): equipes ativas da edição vigente com vagas. */
export async function fetchAvailableTeams(
  params: AvailableTeamsParams = {},
): Promise<Paginated<TeamListing>> {
  const { data } = await http.get<Paginated<RawTeamListing> | RawTeamListing[]>('/api/teams', {
    params,
  });

  if (Array.isArray(data)) {
    const query = params.search?.trim() ?? '';
    const filtered = data.map(normalizeTeamListing).filter((team) => {
      if (params.interest_area && team.interest_area !== params.interest_area) return false;
      if (!query) return true;
      const needle = normalizeText(query);
      return (
        normalizeText(team.name).includes(needle) ||
        sameTeamCode(team.code, query) ||
        normalizeText(team.code).includes(needle)
      );
    });

    const pageSize = Math.max(1, params.page_size ?? 10);
    const page = Math.max(1, params.page ?? 1);
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);
    return {
      count: filtered.length,
      next: start + pageSize < filtered.length ? String(page + 1) : null,
      previous: page > 1 ? String(page - 1) : null,
      results,
    };
  }

  return {
    count: typeof data.count === 'number' ? data.count : 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results.map(normalizeTeamListing) : [],
  };
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

/** GET /api/me/invitations — teamsListMyInvitations (RF23): convites recebidos pelo aluno. */
export async function fetchMyInvitations(status?: InvitationStatus): Promise<Invitation[]> {
  const { data } = await http.get<Invitation[]>('/api/me/invitations', {
    params: status ? { status } : undefined,
  });
  return data;
}

/**
 * POST /api/invitations/{invitation_id}/respond — teamsRespondInvitation (RF23).
 * Ao aceitar, o aluno entra como MEMBER (se houver vaga e não estiver em outra equipe).
 */
export async function respondInvitation(
  invitationId: number,
  status: InvitationResponse['status'],
): Promise<Invitation> {
  const body: InvitationResponse = { status };
  const { data } = await http.post<Invitation>(`/api/invitations/${invitationId}/respond`, body);
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
