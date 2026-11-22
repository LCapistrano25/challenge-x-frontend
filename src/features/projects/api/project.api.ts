import { isAxiosError } from 'axios';
import { http } from '@/shared/lib/http';
import type {
  Project,
  ProjectCategoryInput,
  ProjectChallengeInput,
  ProjectDetailsInput,
  ProjectDraft,
  ProjectOptions,
} from '../types';

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

/** Passo 1: PUT /api/teams/{team_id}/project/challenge (RF29) — cria o projeto se não existir. */
export async function selectProjectChallenge(
  teamId: number,
  input: ProjectChallengeInput,
): Promise<Project> {
  const { data } = await http.put<Project>(`/api/teams/${teamId}/project/challenge`, input);
  return data;
}

/** Passo 2: PUT /api/teams/{team_id}/project/details (RF30). */
export async function saveProjectDetails(
  teamId: number,
  input: ProjectDetailsInput,
): Promise<Project> {
  const { data } = await http.put<Project>(`/api/teams/${teamId}/project/details`, input);
  return data;
}

/** Passo 3: PUT /api/teams/{team_id}/project/category (RF30, RF49). */
export async function selectProjectCategory(
  teamId: number,
  input: ProjectCategoryInput,
): Promise<Project> {
  const { data } = await http.put<Project>(`/api/teams/${teamId}/project/category`, input);
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
 */
export async function saveProjectDraft(teamId: number, draft: ProjectDraft): Promise<ProjectDraft> {
  const { data } = await http.put<ProjectDraft>(`/api/teams/${teamId}/project/draft`, draft);
  return data;
}
