import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/shared/types/api';

export type ApiError = ApiErrorBody['error'] & { status: number | null };

function isErrorBody(data: unknown): data is ApiErrorBody {
  if (typeof data !== 'object' || data === null || !('error' in data)) return false;
  const error = (data as { error: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

/**
 * Lê o erro no formato padrão da API (schema Error). Retorna null para falhas de rede ou
 * respostas fora do contrato, para a tela mostrar uma mensagem genérica.
 */
export function getApiError(error: unknown): ApiError | null {
  if (!isAxiosError(error)) return null;
  const data: unknown = error.response?.data;
  if (!isErrorBody(data)) return null;
  return {
    code: data.error.code,
    message: data.error.message,
    details: data.error.details ?? null,
    status: error.response?.status ?? null,
  };
}
