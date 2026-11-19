import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsKey } from '@/features/notifications';
import {
  cancelJoinRequest,
  createJoinRequest,
  createTeam,
  fetchAvailableTeams,
  fetchMyInvitations,
  fetchMyJoinRequests,
  findTeamByCode,
  respondInvitation,
} from '../api/teams.api';
import type { AvailableTeamsParams } from '../types';
import { studentDashboardKey } from './useStudentDashboard';

export const availableTeamsKey = ['teams', 'available'] as const;
export const myPendingJoinRequestsKey = ['teams', 'me', 'join-requests', 'PENDING'] as const;
export const myPendingInvitationsKey = ['teams', 'me', 'invitations', 'PENDING'] as const;

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

/** Convites PENDING recebidos pelo aluno (Home sem equipe). */
export function useMyPendingInvitations({ enabled = true } = {}) {
  return useQuery({
    queryKey: myPendingInvitationsKey,
    queryFn: () => fetchMyInvitations('PENDING'),
    enabled,
  });
}

/** Aceitar entra na equipe (o painel muda); recusar só tira o convite da lista. */
export function useRespondInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACCEPTED' | 'DECLINED' }) =>
      respondInvitation(id, status),
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: myPendingInvitationsKey });
      if (variables.status === 'ACCEPTED') {
        void queryClient.invalidateQueries({ queryKey: studentDashboardKey });
        void queryClient.invalidateQueries({ queryKey: availableTeamsKey });
        void queryClient.invalidateQueries({ queryKey: myPendingJoinRequestsKey });
        void queryClient.invalidateQueries({ queryKey: notificationsKey });
      }
    },
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
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
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
