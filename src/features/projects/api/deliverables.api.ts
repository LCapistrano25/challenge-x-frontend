import { http } from '@/shared/lib/http';
import type { StageDeliverable } from '../types';

/**
 * GET /api/projects/{project_id}/deliverables — projectsListDeliverables (RF31, RF38, confirmada).
 * Por etapa com campos de entrega: campos exigidos, status e histórico de versões.
 */
export async function fetchProjectDeliverables(projectId: number): Promise<StageDeliverable[]> {
  const { data } = await http.get<StageDeliverable[]>(`/api/projects/${projectId}/deliverables`);
  return data;
}
