import { isAxiosError } from 'axios';
import { http } from '@/shared/lib/http';
import type { Project, ProjectDraft, ProjectOptions, ProjectWrite } from '../types';

/** 404 significa "ainda não existe": a tela trata como ausência, não como erro. */
async function orNullOn404<T>(request: Promise<{ data: T }>): Promise<T | null> {
  try {
    const { data } = await request;
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

/**
 * GET /api/teams/{team_id}/project — projectsGetTeamProject (RF30, RF20).
 * Retorna null enquanto o projeto não foi cadastrado (404).
 */
export function fetchTeamProject(teamId: number): Promise<Project | null> {
  return orNullOn404(http.get<Project>(`/api/teams/${teamId}/project`));
}

/** GET /api/teams/{team_id}/project/options — projectsGetOptions (RF29, RF50). */
export async function fetchProjectOptions(teamId: number): Promise<ProjectOptions> {
  const { data } = await http.get<ProjectOptions>(`/api/teams/${teamId}/project/options`);
  return data;
}

/**
 * PUT /api/teams/{team_id}/project — projectsSaveTeamProject (RF29, RF30, RF50;
 * x-status: proposed, P-25). Somente o LEADER, durante a formação. Conclui o cadastro.
 */
export async function saveTeamProject(teamId: number, input: ProjectWrite): Promise<Project> {
  const { data } = await http.put<Project>(`/api/teams/${teamId}/project`, input);
  return data;
}

/**
 * PROPOSTA (ainda não está no openapi): GET /api/teams/{team_id}/project/draft.
 * Retorna null quando a equipe ainda não salvou rascunho (404).
 */
export function fetchProjectDraft(teamId: number): Promise<ProjectDraft | null> {
  return orNullOn404(http.get<ProjectDraft>(`/api/teams/${teamId}/project/draft`));
}

/**
 * PROPOSTA (ainda não está no openapi): PUT /api/teams/{team_id}/project/draft.
 * Guarda o preenchimento sem validar obrigatórios e sem concluir a inscrição.
 */
export async function saveProjectDraft(teamId: number, draft: ProjectDraft): Promise<ProjectDraft> {
  const { data } = await http.put<ProjectDraft>(`/api/teams/${teamId}/project/draft`, draft);
  return data;
}
