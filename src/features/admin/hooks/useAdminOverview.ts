import { useQuery } from '@tanstack/react-query';
import { fetchAdminOverview } from '../api/overview.api';

export const adminOverviewKey = ['admin', 'overview'] as const;

/** Painel administrativo (RF20): métricas, ações rápidas e gestão da edição. */
export function useAdminOverview() {
  return useQuery({ queryKey: adminOverviewKey, queryFn: fetchAdminOverview });
}
