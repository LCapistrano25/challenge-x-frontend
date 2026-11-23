import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decideLeadershipRequest,
  fetchTeacherLeadershipRequests,
  fetchTeacherProjects,
  fetchTeamMemberNotes,
} from '../api/teacher.api';
import type { LeadershipDecision, TeamRef } from '../types';

export const teacherLeadershipRequestsKey = ['teams', 'teacher', 'leadership-requests'] as const;
export const teacherProjectsKey = ['teams', 'teacher', 'projects'] as const;
export const teamMemberNotesKey = (teamId: number) => ['teams', teamId, 'member-notes'] as const;

/** Solicitações de liderança dos cursos do professor (RF40). */
export function useTeacherLeadershipRequests() {
  return useQuery({
    queryKey: teacherLeadershipRequestsKey,
    queryFn: () => fetchTeacherLeadershipRequests(),
  });
}

/** Registra a decisão do professor e recarrega a fila de solicitações. */
export function useDecideLeadershipRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: LeadershipDecision }) =>
      decideLeadershipRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherLeadershipRequestsKey });
    },
  });
}

/** Equipes dos cursos vinculados do professor, sem repetição (deriva de /teacher/projects). */
export function useTeacherTeams() {
  const query = useQuery({ queryKey: teacherProjectsKey, queryFn: fetchTeacherProjects });
  const teams = useMemo<TeamRef[]>(() => {
    const byId = new Map<number, TeamRef>();
    for (const row of query.data ?? []) {
      if (!byId.has(row.team.id)) byId.set(row.team.id, row.team);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [query.data]);
  return { ...query, teams };
}

/** Avaliações que o líder registrou sobre os integrantes de uma equipe (RF39). */
export function useTeamMemberNotes(teamId: number | undefined) {
  return useQuery({
    queryKey: teamMemberNotesKey(teamId ?? 0),
    queryFn: () => fetchTeamMemberNotes(teamId as number),
    enabled: teamId != null,
  });
}
