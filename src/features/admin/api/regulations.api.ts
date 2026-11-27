import { http } from '@/shared/lib/http';
import type { Regulation, RegulationStatus } from '../types';

/**
 * Editais da edição (RF09). A API ainda guarda só `regulation_url` na edição; as versões,
 * minutas e o envio do PDF são proposta: docs/api/propostas/editais-e-avaliadores.md (P-E1 a P-E5).
 */

export interface RegulationFilters {
  editionId?: number;
  status?: RegulationStatus;
  search?: string;
}

/** GET /api/admin/regulations (proposta P-E1) — versões de todas as edições, mais recentes antes. */
export async function fetchRegulations(filters: RegulationFilters = {}): Promise<Regulation[]> {
  const { data } = await http.get<Regulation[]>('/api/admin/regulations', {
    params: {
      edition_id: filters.editionId,
      status: filters.status,
      search: filters.search || undefined,
    },
  });
  return data;
}

/** GET /api/admin/regulations/{regulation_id} (proposta P-E1). */
export async function fetchRegulation(regulationId: number): Promise<Regulation> {
  const { data } = await http.get<Regulation>(`/api/admin/regulations/${regulationId}`);
  return data;
}

export interface RegulationDraftInput {
  title: string;
  description: string;
  /** Obrigatório ao criar; na edição, sem arquivo o PDF atual é mantido. */
  file: File | null;
}

function toFormData(input: RegulationDraftInput) {
  const form = new FormData();
  form.append('title', input.title);
  form.append('description', input.description);
  if (input.file) form.append('file', input.file);
  return form;
}

/**
 * POST /api/admin/editions/{edition_id}/regulations (proposta P-E2, multipart). Cria a minuta
 * na próxima versão da edição; a versão publicada continua intacta.
 */
export async function createRegulation(
  editionId: number,
  input: RegulationDraftInput,
): Promise<Regulation> {
  const { data } = await http.post<Regulation>(
    `/api/admin/editions/${editionId}/regulations`,
    toFormData(input),
  );
  return data;
}

/** PATCH /api/admin/regulations/{regulation_id} (proposta P-E3) — só minutas (409 regulation_published). */
export async function updateRegulation(
  regulationId: number,
  input: RegulationDraftInput,
): Promise<Regulation> {
  const { data } = await http.patch<Regulation>(
    `/api/admin/regulations/${regulationId}`,
    toFormData(input),
  );
  return data;
}

/** GET /api/admin/regulations/{regulation_id}/file (proposta P-E4) — o PDF da versão. */
export async function downloadRegulationFile(regulationId: number): Promise<Blob> {
  const { data } = await http.get<Blob>(`/api/admin/regulations/${regulationId}/file`, {
    responseType: 'blob',
  });
  return data;
}

/**
 * POST /api/admin/regulations/{regulation_id}/publish (proposta P-E5). A versão publicada
 * anterior passa a SUPERSEDED. Para edição em configuração, faz o que hoje faz
 * POST /api/admin/editions/{edition_id}/publish (valida etapas, critérios e o total de 10,0).
 */
export async function publishRegulation(regulationId: number): Promise<Regulation> {
  const { data } = await http.post<Regulation>(`/api/admin/regulations/${regulationId}/publish`);
  return data;
}
