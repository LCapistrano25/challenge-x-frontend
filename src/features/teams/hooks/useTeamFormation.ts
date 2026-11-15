import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelJoinRequest,
  createJoinRequest,
  createTeam,
  fetchAvailableTeams,
  fetchMyJoinRequests,
  findTeamByCode,
} from '../api/teams.api';
import type { AvailableTeamsParams } from '../types';
import { studentDashboardKey } from './useStudentDashboard';

export const availableTeamsKey = ['teams', 'available'] as const;
export const myPendingJoinRequestsKey = ['teams', 'me', 'join-requests', 'PENDING'] as const;

/** Equipes com vagas (busca e filtro no servidor; mantém a página anterior durante a busca). */
export function useAvailableTeams(params: AvailableTeamsParams, { enabled = true } = {}) {
  return useQuery({
    queryKey: [...availableTeamsKey, params],
    queryFn: () => fetchAvailableTeams(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Solicitações PENDING do aluno: marcam "Solicitação enviada" nos cartões. */
export function useMyPendingJoinRequests({ enabled = true } = {}) {
  return useQuery({
    queryKey: myPendingJoinRequestsKey,
    queryFn: () => fetchMyJoinRequests('PENDING'),
    enabled,
  });
}

/** Ao criar a equipe, o painel do aluno passa a ter equipe (ele vira líder). */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentDashboardKey });
      void queryClient.invalidateQueries({ queryKey: availableTeamsKey });
    },
  });
}

export function useCreateJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJoinRequest,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: myPendingJoinRequestsKey });
    },
  });
}

export function useCancelJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelJoinRequest,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: myPendingJoinRequestsKey });
    },
  });
}

/** "Verificar código": consulta sob demanda, por isso é uma mutation. */
export function useFindTeamByCode() {
  return useMutation({ mutationFn: findTeamByCode });
}
