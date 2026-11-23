import { getApiError } from '@/shared/lib/api-error';
import type { BadgeTone } from '@/shared/ui';
import type { RequestStatus } from '../types';

/** Rótulo da situação da solicitação de liderança (Figma: 05 - Professor › Liderança). */
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  CANCELLED: 'Cancelada',
};

/** Cor da situação (pendente neutro, aprovada verde, recusada/cancelada cinza). */
export const REQUEST_STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  PENDING: 'progress',
  APPROVED: 'success',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
};

/** "22 de outubro de 2026 às 16:00" */
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

/** "08/10/2026" */
export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

const hourMinute = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(iso))
    .replace(':', 'h');

/** "08/10/2026 • 09h10" (padrão do Figma "Aprovação de Liderança"). */
export const formatDateHour = (iso: string) => `${formatShortDate(iso)} • ${hourMinute(iso)}`;

/** "05/10/2026 às 16h20" (padrão do Figma "Observações sobre Integrantes"). */
export const formatDateAtHour = (iso: string) => `${formatShortDate(iso)} às ${hourMinute(iso)}`;

export function describeLeadershipDecisionError(error: unknown) {
  const apiError = getApiError(error);
  if (apiError?.code === 'leadership_request_not_pending')
    return 'Esta solicitação já foi decidida.';
  if (apiError?.code === 'team_has_leader') return 'A equipe já possui um líder ativo.';
  if (apiError?.status === 403) return 'Você não tem vínculo ativo com o curso desta equipe.';
  if (apiError?.status === 404) return 'A solicitação não foi encontrada.';
  return apiError?.message ?? 'Não foi possível registrar a decisão. Tente novamente.';
}
