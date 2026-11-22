import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import type { FinalistProjectDetail, FinalistRow, FinalistsQuery } from '../types';

/** A banca é pequena: a tela busca tudo de uma vez e filtra na própria página (máximo da API). */
export const FINALISTS_PAGE_SIZE = 100;

/** GET /api/evaluator/finalists (RF42, x-status: proposed — P-29, P-32). */
export async function fetchFinalists(query: FinalistsQuery = {}): Promise<Paginated<FinalistRow>> {
  const { data } = await http.get<Paginated<FinalistRow>>('/api/evaluator/finalists', {
    params: { page_size: FINALISTS_PAGE_SIZE, ...query },
  });
  return data;
}

/** PROPOSTA: GET /api/evaluator/finalists/{project_id} — detalhe do projeto para a banca. */
export async function fetchFinalistProject(projectId: string): Promise<FinalistProjectDetail> {
  const { data } = await http.get<FinalistProjectDetail>(`/api/evaluator/finalists/${projectId}`);
  return data;
}
