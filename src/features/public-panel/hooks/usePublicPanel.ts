import { useQuery } from '@tanstack/react-query';
import {
  fetchClosedEditions,
  fetchCourses,
  fetchCurrentEdition,
  fetchEditionWinners,
  fetchPublicProject,
  fetchPublicProjects,
} from '../api/public.api';
import type { PublicProjectsQuery } from '../types';

export const publicKeys = {
  currentEdition: ['public', 'editions', 'current'] as const,
  closedEditions: ['public', 'editions', 'closed'] as const,
  winners: (editionId: number) => ['public', 'editions', editionId, 'winners'] as const,
  projects: (params: PublicProjectsQuery) => ['public', 'projects', params] as const,
  courses: ['public', 'courses'] as const,
  project: (id: number) => ['public', 'projects', 'detail', id] as const,
};

export function useCurrentEdition() {
  return useQuery({
    queryKey: publicKeys.currentEdition,
    queryFn: fetchCurrentEdition,
    staleTime: 5 * 60_000,
  });
}

export function usePublicProjects(params: PublicProjectsQuery = {}) {
  return useQuery({
    queryKey: publicKeys.projects(params),
    queryFn: () => fetchPublicProjects(params),
  });
}

export function useCourses() {
  return useQuery({
    queryKey: publicKeys.courses,
    queryFn: fetchCourses,
    staleTime: 5 * 60_000,
  });
}

export function usePublicProject(projectId: number | undefined) {
  return useQuery({
    queryKey: publicKeys.project(projectId ?? 0),
    queryFn: () => fetchPublicProject(projectId as number),
    enabled: projectId != null,
  });
}

/** Edições encerradas para o acervo histórico (RF35/RF46). */
export function useClosedEditions() {
  return useQuery({
    queryKey: publicKeys.closedEditions,
    queryFn: fetchClosedEditions,
    staleTime: 5 * 60_000,
  });
}

/** Pódio de vencedores de uma edição encerrada (RF35/RF46). */
export function useEditionWinners(editionId: number | undefined) {
  return useQuery({
    queryKey: publicKeys.winners(editionId ?? 0),
    queryFn: () => fetchEditionWinners(editionId as number),
    enabled: editionId != null,
  });
}
