import { getApiError } from '@/shared/lib/api-error';
import type { AdminTeamSituation } from '../types';

export type SituationTone = 'neutral' | 'progress' | 'success' | 'danger';

export const SITUATION_LABEL: Record<AdminTeamSituation, string> = {
  PRE_REGISTERED: 'Pré-cadastro',
  PENDING: 'Pendente',
  VALIDATED: 'Inscrição validada',
  DISQUALIFIED: 'Desclassificada',
};

export const SITUATION_TONE: Record<AdminTeamSituation, SituationTone> = {
  PRE_REGISTERED: 'neutral',
  PENDING: 'progress',
  VALIDATED: 'success',
  DISQUALIFIED: 'danger',
};

export function describeDisqualifyError(error: unknown) {
  const apiError = getApiError(error);
  if (apiError?.code === 'team_already_disqualified') return 'A equipe já está desclassificada.';
  if (apiError?.code === 'edition_closed')
    return 'A edição está encerrada e não pode ser alterada.';
  if (apiError?.status === 403) return 'Apenas administradores podem desclassificar equipes.';
  if (apiError?.status === 404) return 'A equipe não foi encontrada.';
  return apiError?.message ?? 'Não foi possível desclassificar a equipe. Tente novamente.';
}
