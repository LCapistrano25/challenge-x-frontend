import { http } from '@/shared/lib/http';
import type { ProjectScores } from '../types';

/**
 * GET /api/projects/{project_id}/scores — evaluationsGetProjectScores (RF32, confirmado).
 * Por etapa pontuada: nota, situação, média por critério e feedbacks dos professores.
 */
export async function fetchProjectScores(projectId: number): Promise<ProjectScores> {
  const { data } = await http.get<ProjectScores>(`/api/projects/${projectId}/scores`);
  return data;
}
