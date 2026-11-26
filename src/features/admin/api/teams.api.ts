import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import type { AdminTeamDetail, AdminTeamListItem, TeamDisqualifyInput } from '../types';

export interface AdminTeamsQuery {
  edition_id?: number;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/** GET /api/admin/teams — teamsAdminList (RF13). */
export async function fetchAdminTeams(
  params: AdminTeamsQuery = {},
): Promise<Paginated<AdminTeamListItem>> {
  const { data } = await http.get<Paginated<AdminTeamListItem>>('/api/admin/teams', { params });
  return data;
}

/** GET /api/admin/teams/{id} — detalhe da equipe para a administração (RF13, PROPOSTO). */
export async function fetchAdminTeam(teamId: number): Promise<AdminTeamDetail> {
  const { data } = await http.get<AdminTeamDetail>(`/api/admin/teams/${teamId}`);
  return data;
}

/** POST /api/admin/teams/{id}/disqualify — teamsDisqualify (RF13). */
export async function disqualifyTeam(teamId: number, input: TeamDisqualifyInput): Promise<void> {
  await http.post(`/api/admin/teams/${teamId}/disqualify`, input);
}
