import { useQuery } from '@tanstack/react-query';
import { fetchFinalistProject, fetchFinalists } from '../api/finalists.api';

export const finalistsKeys = {
  all: ['evaluator', 'finalists'] as const,
  list: () => [...finalistsKeys.all, 'list'] as const,
  detail: (projectId: string) => [...finalistsKeys.all, 'detail', projectId] as const,
};

/** Projetos finalistas da banca do avaliador autenticado. */
export function useFinalists() {
  return useQuery({
    queryKey: finalistsKeys.list(),
    queryFn: () => fetchFinalists(),
    retry: false,
  });
}

/** Detalhe de um projeto finalista (sobre o projeto, integrantes e arquivos entregues). */
export function useFinalistProject(projectId: string) {
  return useQuery({
    queryKey: finalistsKeys.detail(projectId),
    queryFn: () => fetchFinalistProject(projectId),
    enabled: projectId !== '',
    retry: false,
  });
}
