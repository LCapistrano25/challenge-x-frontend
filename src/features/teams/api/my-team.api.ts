import { http } from '@/shared/lib/http';
import type {
  Invitation,
  InvitationCreate,
  InvitationStatus,
  JoinRequest,
  JoinRequestDecision,
  LeadershipRequest,
  RequestStatus,
  Team,
  TeamUpdate,
} from '../types';

/* --- Equipe --- */

/** GET /api/teams/{team_id} — teamsGet (RF13, RF20): equipe com integrantes ativos. */
export async function fetchTeam(teamId: number): Promise<Team> {
  const { data } = await http.get<Team>(`/api/teams/${teamId}`);
  return data;
}

/**
 * PROPOSTA (ainda não está no openapi): PATCH /api/teams/{team_id} — o líder edita nome e
 * apresentação ("Editar informações" no Figma). Mesmas regras de TeamCreate.
 */
export async function updateTeam(teamId: number, input: TeamUpdate): Promise<Team> {
  const { data } = await http.patch<Team>(`/api/teams/${teamId}`, input);
  return data;
}

/* --- Convites (RF22) --- */

/** GET /api/teams/{team_id}/invitations — teamsListInvitations (somente o líder). */
export async function fetchTeamInvitations(
  teamId: number,
  status?: InvitationStatus,
): Promise<Invitation[]> {
  const { data } = await http.get<Invitation[]>(`/api/teams/${teamId}/invitations`, {
    params: status ? { status } : undefined,
  });
  return data;
}

/** POST /api/teams/{team_id}/invitations — teamsCreateInvitation (por e-mail institucional). */
export async function createInvitation(
  teamId: number,
  input: InvitationCreate,
): Promise<Invitation> {
  const { data } = await http.post<Invitation>(`/api/teams/${teamId}/invitations`, input);
  return data;
}

/**
 * PROPOSTA (ainda não está no openapi): o líder cancela um convite PENDING. O enum
 * InvitationStatus já prevê CANCELLED, mas não há rota. Mesmo padrão de /respond.
 */
export async function cancelInvitation(invitationId: number): Promise<Invitation> {
  const { data } = await http.post<Invitation>(`/api/invitations/${invitationId}/cancel`);
  return data;
}

/* --- Solicitações de entrada (RF25) --- */

/** GET /api/teams/{team_id}/join-requests — teamsListJoinRequests (somente o líder). */
export async function fetchTeamJoinRequests(
  teamId: number,
  status?: RequestStatus,
): Promise<JoinRequest[]> {
  const { data } = await http.get<JoinRequest[]>(`/api/teams/${teamId}/join-requests`, {
    params: status ? { status } : undefined,
  });
  return data;
}

/** POST /api/join-requests/{join_request_id}/respond — teamsRespondJoinRequest. */
export async function respondJoinRequest(
  joinRequestId: number,
  decision: JoinRequestDecision,
): Promise<JoinRequest> {
  const { data } = await http.post<JoinRequest>(
    `/api/join-requests/${joinRequestId}/respond`,
    decision,
  );
  return data;
}

/* --- Integrantes, liderança e saída --- */

/**
 * PROPOSTA (ainda não está no openapi): o líder remove um integrante ("Remover" no Figma).
 * Encerra o vínculo (left_at, active=false), como na saída voluntária (RF26).
 */
export async function removeMember(teamId: number, memberId: number): Promise<void> {
  await http.delete(`/api/teams/${teamId}/members/${memberId}`);
}

/** POST /api/teams/{team_id}/leadership-transfer — teamsTransferLeadership (RF27). */
export async function transferLeadership(teamId: number, memberId: number): Promise<Team> {
  const { data } = await http.post<Team>(`/api/teams/${teamId}/leadership-transfer`, {
    member_id: memberId,
  });
  return data;
}

/** POST /api/teams/{team_id}/leave — teamsLeave (RF26, x-status: proposed, P-25). */
export async function leaveTeam(teamId: number): Promise<void> {
  await http.post(`/api/teams/${teamId}/leave`);
}

/** GET /api/teams/{team_id}/leadership-requests — teamsListLeadershipRequests (RF28). */
export async function fetchLeadershipRequests(teamId: number): Promise<LeadershipRequest[]> {
  const { data } = await http.get<LeadershipRequest[]>(`/api/teams/${teamId}/leadership-requests`);
  return data;
}

/** POST /api/teams/{team_id}/leadership-requests — teamsCreateLeadershipRequest (RF28). */
export async function createLeadershipRequest(
  teamId: number,
  justification: string,
): Promise<LeadershipRequest> {
  const { data } = await http.post<LeadershipRequest>(`/api/teams/${teamId}/leadership-requests`, {
    justification,
  });
  return data;
}
