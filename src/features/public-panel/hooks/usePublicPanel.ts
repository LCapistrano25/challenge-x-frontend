import { useQuery } from '@tanstack/react-query';
import { fetchCurrentEdition, fetchPublicProject, fetchPublicProjects } from '../api/public.api';
import type { PublicProjectsQuery } from '../types';

export const publicKeys = {
  currentEdition: ['public', 'editions', 'current'] as const,
  projects: (params: PublicProjectsQuery) => ['public', 'projects', params] as const,
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

export function usePublicProject(projectId: number | undefined) {
  return useQuery({
    queryKey: publicKeys.project(projectId ?? 0),
    queryFn: () => fetchPublicProject(projectId as number),
    enabled: projectId != null,
  });
}
