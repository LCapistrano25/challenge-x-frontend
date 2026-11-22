import { http } from '@/shared/lib/http';
import type { FinalEvaluation, FinalEvaluationForm, FinalEvaluationWrite } from '../types';

const path = (projectId: string) => `/api/evaluator/finalists/${projectId}/final-evaluation`;

/** GET .../final-evaluation: formulário publicado e a avaliação do avaliador, se existir. */
export async function fetchFinalEvaluation(projectId: string): Promise<FinalEvaluationForm> {
  const { data } = await http.get<FinalEvaluationForm>(path(projectId));
  return data;
}

/**
 * PUT .../final-evaluation (x-status: proposed, P-30). IN_PROGRESS guarda o preenchimento;
 * FINALIZED envia de forma definitiva e torna a avaliação imutável.
 */
export async function saveFinalEvaluation(
  projectId: string,
  input: FinalEvaluationWrite,
): Promise<FinalEvaluation> {
  const { data } = await http.put<FinalEvaluation>(path(projectId), input);
  return data;
}
