import { useQuery } from '@tanstack/react-query';
import { fetchCurrentEdition, fetchPublicProjects } from '../api/public.api';
import type { PublicProjectsQuery } from '../types';

export const publicKeys = {
  currentEdition: ['public', 'editions', 'current'] as const,
  projects: (params: PublicProjectsQuery) => ['public', 'projects', params] as const,
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
