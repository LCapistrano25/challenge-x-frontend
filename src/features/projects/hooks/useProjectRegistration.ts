import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentDashboardKey, type StudentDashboard } from '@/features/teams';
import {
  fetchProjectDraft,
  fetchProjectOptions,
  fetchTeamProject,
  saveProjectDetails,
  saveProjectDraft,
  selectProjectCategory,
  selectProjectChallenge,
} from '../api/project.api';
import type { Project, ProjectDraft, ProjectWrite } from '../types';

export const teamProjectKey = (teamId: number) => ['teams', teamId, 'project'] as const;
export const projectOptionsKey = (teamId: number) =>
  ['teams', teamId, 'project', 'options'] as const;
export const projectDraftKey = (teamId: number) => ['teams', teamId, 'project', 'draft'] as const;

function syncProjectCache(
  queryClient: ReturnType<typeof useQueryClient>,
  teamId: number,
  project: Project,
) {
  queryClient.setQueryData(teamProjectKey(teamId), project);
  queryClient.setQueryData<StudentDashboard>(studentDashboardKey, (dashboard) =>
    dashboard
      ? {
          ...dashboard,
          project: {
            id: project.id,
            title: project.title,
            summary: project.summary,
            status: project.status,
            challenge: project.challenge,
          },
        }
      : dashboard,
  );
  void queryClient.invalidateQueries({ queryKey: studentDashboardKey });
}

/** Projeto cadastrado da equipe (null enquanto não houver). */
export function useTeamProject(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: teamProjectKey(teamId ?? 0),
    queryFn: () => fetchTeamProject(teamId as number),
    enabled: enabled && teamId != null,
  });
}

/** Desafios (com a ODS) e categorias elegíveis para a equipe. */
export function useProjectOptions(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: projectOptionsKey(teamId ?? 0),
    queryFn: () => fetchProjectOptions(teamId as number),
    enabled: enabled && teamId != null,
  });
}

/** Rascunho salvo (null se não houver). */
export function useProjectDraft(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: projectDraftKey(teamId ?? 0),
    queryFn: () => fetchProjectDraft(teamId as number),
    enabled: enabled && teamId != null,
  });
}

export function useSaveProjectDraft(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: ProjectDraft) => saveProjectDraft(teamId, draft),
    onSuccess: (draft) => queryClient.setQueryData(projectDraftKey(teamId), draft),
  });
}

/** Passo 1: seleciona o desafio (e cria o projeto caso ainda não exista). */
export function useSelectProjectChallenge(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: number) =>
      selectProjectChallenge(teamId, { challenge_id: challengeId }),
    onSuccess: (project) => syncProjectCache(queryClient, teamId, project),
  });
}

/**
 * Conclui ou atualiza o projeto seguindo a ordem exigida pelo contrato:
 * 1. desafio (se ainda não salvo ou alterado) -> 2. dados -> 3. categoria.
 */
export function useRegisterProject(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectWrite) => {
      const current = queryClient.getQueryData<Project | null>(teamProjectKey(teamId));
      if (!current || current.challenge?.id !== input.challenge_id) {
        await selectProjectChallenge(teamId, { challenge_id: input.challenge_id });
      }
      await saveProjectDetails(teamId, {
        title: input.title,
        summary: input.summary,
        objective: input.objective,
      });
      return selectProjectCategory(teamId, { category_id: input.category_id });
    },
    onSuccess: (project) => {
      queryClient.removeQueries({ queryKey: projectDraftKey(teamId) });
      syncProjectCache(queryClient, teamId, project);
    },
  });
}
