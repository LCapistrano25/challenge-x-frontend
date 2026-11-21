import type { DeliverableVersion } from '@/features/projects';
import { downloadAuthenticatedFile } from '@/shared/lib/download';
import { http } from '@/shared/lib/http';
import type { DeliverableSubmissionJson } from '../types';

/**
 * POST /api/projects/{project_id}/stages/{stage_id}/versions — projectsSubmitDeliverableVersion.
 * Aceita JSON (quando não há arquivos) ou FormData (com `items` JSON, `files[]` e `notes`).
 * O interceptor em http.ts remove Content-Type para FormData para o navegador definir o boundary.
 */
export async function submitDeliverableVersion(
  projectId: number,
  stageId: number,
  body: FormData | DeliverableSubmissionJson,
): Promise<DeliverableVersion> {
  const { data } = await http.post<DeliverableVersion>(
    `/api/projects/${projectId}/stages/${stageId}/versions`,
    body,
  );
  return data;
}

export const downloadDeliverableFile = downloadAuthenticatedFile;
