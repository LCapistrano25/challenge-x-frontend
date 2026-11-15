import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelInvitation,
  createInvitation,
  createLeadershipRequest,
  fetchLeadershipRequests,
  fetchTeam,
  fetchTeamInvitations,
  fetchTeamJoinRequests,
  leaveTeam,
  removeMember,
  respondJoinRequest,
  transferLeadership,
  updateTeam,
} from '../api/my-team.api';
import type { InvitationCreate, JoinRequestDecision, Team, TeamUpdate } from '../types';
import { studentDashboardKey } from './useStudentDashboard';
import { availableTeamsKey } from './useTeamFormation';

export const teamKey = (teamId: number) => ['teams', teamId] as const;
export const teamInvitationsKey = (teamId: number) =>
  ['teams', teamId, 'invitations', 'PENDING'] as const;
export const teamJoinRequestsKey = (teamId: number) =>
  ['teams', teamId, 'join-requests', 'PENDING'] as const;
export const leadershipRequestsKey = (teamId: number) =>
  ['teams', teamId, 'leadership-requests'] as const;

/* --- Consultas --- */

/** Equipe com integrantes ativos (GET /api/teams/{id}). */
export function useTeam(teamId: number | undefined) {
  return useQuery({
    queryKey: teamKey(teamId ?? 0),
    queryFn: () => fetchTeam(teamId as number),
    enabled: teamId != null,
  });
}

/** Convites PENDING enviados pela equipe (somente o líder consulta). */
export function useTeamInvitations(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: teamInvitationsKey(teamId ?? 0),
    queryFn: () => fetchTeamInvitations(teamId as number, 'PENDING'),
    enabled: enabled && teamId != null,
  });
}

/** Solicitações de entrada PENDING recebidas pela equipe (somente o líder consulta). */
export function useTeamJoinRequests(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: teamJoinRequestsKey(teamId ?? 0),
    queryFn: () => fetchTeamJoinRequests(teamId as number, 'PENDING'),
    enabled: enabled && teamId != null,
  });
}

/** Histórico de solicitações de liderança (equipe sem líder). */
export function useLeadershipRequests(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: leadershipRequestsKey(teamId ?? 0),
    queryFn: () => fetchLeadershipRequests(teamId as number),
    enabled: enabled && teamId != null,
  });
}

/* --- Ações --- */

/**
 * Depois de cada ação, recarrega a equipe, as pendências e o painel do aluno: as contagens de
 * integrantes, vagas e pendências precisam refletir o novo estado (critério de aceitação).
 */
function useRefreshTeam(teamId: number) {
  const queryClient = useQueryClient();
  return (team?: Team) => {
    if (team) queryClient.setQueryData(teamKey(teamId), team);
    void queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
    void queryClient.invalidateQueries({ queryKey: studentDashboardKey });
    void queryClient.invalidateQueries({ queryKey: availableTeamsKey });
  };
}

export function useUpdateTeam(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({
    mutationFn: (input: TeamUpdate) => updateTeam(teamId, input),
    onSuccess: (team) => refresh(team),
  });
}

export function useCreateInvitation(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({
    mutationFn: (input: InvitationCreate) => createInvitation(teamId, input),
    onSettled: () => refresh(),
  });
}

export function useCancelInvitation(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({ mutationFn: cancelInvitation, onSettled: () => refresh() });
}

export function useRespondJoinRequest(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({
    mutationFn: ({ id, status }: { id: number } & JoinRequestDecision) =>
      respondJoinRequest(id, { status }),
    onSettled: () => refresh(),
  });
}

export function useRemoveMember(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({
    mutationFn: (memberId: number) => removeMember(teamId, memberId),
    onSettled: () => refresh(),
  });
}

export function useTransferLeadership(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({
    mutationFn: (memberId: number) => transferLeadership(teamId, memberId),
    onSuccess: (team) => refresh(team),
    onError: () => refresh(),
  });
}

export function useLeaveTeam(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveTeam(teamId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['teams', teamId] });
      void queryClient.invalidateQueries({ queryKey: studentDashboardKey });
      void queryClient.invalidateQueries({ queryKey: availableTeamsKey });
    },
  });
}

export function useCreateLeadershipRequest(teamId: number) {
  const refresh = useRefreshTeam(teamId);
  return useMutation({
    mutationFn: (justification: string) => createLeadershipRequest(teamId, justification),
    onSettled: () => refresh(),
  });
}
