import { http } from '@/shared/lib/http';
import type { AdminOverview } from '../types';

/**
 * GET /api/admin/overview — visão geral do painel administrativo (RF20).
 * PROPOSTO: ainda não está no openapi; confirme o contrato com o back-end.
 */
export async function fetchAdminOverview(): Promise<AdminOverview> {
  const { data } = await http.get<AdminOverview>('/api/admin/overview');
  return data;
}
