import { useQuery } from '@tanstack/react-query';
import { fetchProjectScores } from '../api/scores.api';

export const projectScoresKey = (projectId: number) => ['projects', projectId, 'scores'] as const;

export function useProjectScores(projectId: number | undefined) {
  return useQuery({
    queryKey: projectScoresKey(projectId ?? 0),
    queryFn: () => fetchProjectScores(projectId as number),
    enabled: projectId != null,
  });
}
