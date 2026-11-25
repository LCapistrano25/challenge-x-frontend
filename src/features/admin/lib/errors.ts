import { getApiError } from '@/shared/lib/api-error';

/** Mensagens dos códigos de erro de etapas, critérios e pontuações (openapi, tag editions). */
const MESSAGES: Record<string, string> = {
  edition_published: 'A configuração está congelada após a publicação do edital.',
  edition_closed: 'A edição está encerrada e não pode ser alterada.',
  stage_position_taken: 'Já existe etapa nesta posição.',
  criterion_name_taken: 'Já existe critério com este nome.',
  criterion_in_use_by_evaluations: 'Há avaliações iniciadas em etapa que usa o critério.',
  stage_criteria_sum_mismatch: 'A soma dos critérios não confere com a pontuação da etapa.',
  tiebreak_order_taken: 'Já existe critério nesta posição de desempate.',
};

/** Primeira mensagem de campo em `details` (validation_error do DRF), se houver. */
function firstDetail(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null;
  for (const value of Object.values(details as Record<string, unknown>)) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return null;
}

export function describeSetupError(error: unknown, fallback: string): string {
  const apiError = getApiError(error);
  if (!apiError) return fallback;
  return MESSAGES[apiError.code] ?? firstDetail(apiError.details) ?? (apiError.message || fallback);
}

export const setupErrorCode = (error: unknown) => getApiError(error)?.code ?? null;
