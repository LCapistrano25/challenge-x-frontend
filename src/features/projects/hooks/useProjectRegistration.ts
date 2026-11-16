import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentDashboardKey, type StudentDashboard } from '@/features/teams';
import {
  fetchProjectDraft,
  fetchProjectOptions,
  fetchTeamProject,
  saveProjectDraft,
  saveTeamProject,
} from '../api/project.api';
import type { ProjectDraft, ProjectWrite } from '../types';

export const teamProjectKey = (teamId: number) => ['teams', teamId, 'project'] as const;
export const projectOptionsKey = (teamId: number) =>
  ['teams', teamId, 'project', 'options'] as const;
export const projectDraftKey = (teamId: number) => ['teams', teamId, 'project', 'draft'] as const;

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

/**
 * Conclui o cadastro. Atualiza o projeto em cache e recarrega o painel do aluno, que passa a
 * mostrar o projeto e libera a tela do Projeto (critério de aceitação).
 */
export function useRegisterProject(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectWrite) => saveTeamProject(teamId, input),
    onSuccess: (project) => {
      queryClient.setQueryData(teamProjectKey(teamId), project);
      queryClient.removeQueries({ queryKey: projectDraftKey(teamId) });
      // O painel em cache passa a ter o projeto já agora: sem isso, "Meu Projeto" ainda veria a
      // equipe sem projeto e devolveria o líder ao cadastro até o painel recarregar.
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
    },
  });
}
