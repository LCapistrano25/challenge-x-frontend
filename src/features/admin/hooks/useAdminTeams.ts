import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  disqualifyTeam,
  fetchAdminTeam,
  fetchAdminTeams,
  type AdminTeamsQuery,
} from '../api/teams.api';
import type { TeamDisqualifyInput } from '../types';

export const adminTeamsKey = (params: AdminTeamsQuery) => ['admin', 'teams', params] as const;
export const adminTeamKey = (id: number) => ['admin', 'teams', 'detail', id] as const;

/** Lista de equipes da edição (administração, RF13). */
export function useAdminTeams(params: AdminTeamsQuery = {}) {
  return useQuery({ queryKey: adminTeamsKey(params), queryFn: () => fetchAdminTeams(params) });
}

/** Detalhe da equipe (administração, RF13). */
export function useAdminTeam(teamId: number | undefined) {
  return useQuery({
    queryKey: adminTeamKey(teamId ?? 0),
    queryFn: () => fetchAdminTeam(teamId as number),
    enabled: teamId != null,
  });
}

/** Desclassifica a equipe e recarrega o detalhe + a listagem (RF13). */
export function useDisqualifyTeam(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeamDisqualifyInput) => disqualifyTeam(teamId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTeamKey(teamId) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
    },
  });
}
