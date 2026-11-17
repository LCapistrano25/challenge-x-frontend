import type { DeliverableVersion } from '@/features/projects';
import { http } from '@/shared/lib/http';

/**
 * POST /api/projects/{project_id}/stages/{stage_id}/versions — projectsSubmitDeliverableVersion
 * (RF31, x-status: proposed, P-23/P-43). Corpo multipart (items em JSON, files[] e notes).
 * Cada envio cria uma nova versão imutável e gera o comprovante.
 */
export async function submitDeliverableVersion(
  projectId: number,
  stageId: number,
  body: FormData,
): Promise<DeliverableVersion> {
  const { data } = await http.post<DeliverableVersion>(
    `/api/projects/${projectId}/stages/${stageId}/versions`,
    body,
    // O navegador define o boundary do multipart.
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
