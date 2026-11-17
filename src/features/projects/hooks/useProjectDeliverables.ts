import { useQuery } from '@tanstack/react-query';
import { fetchProjectDeliverables } from '../api/deliverables.api';

export const projectDeliverablesKey = (projectId: number) =>
  ['projects', projectId, 'deliverables'] as const;

/** Entregas por etapa do projeto, com o histórico de versões. */
export function useProjectDeliverables(projectId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: projectDeliverablesKey(projectId ?? 0),
    queryFn: () => fetchProjectDeliverables(projectId as number),
    enabled: enabled && projectId != null,
  });
}
