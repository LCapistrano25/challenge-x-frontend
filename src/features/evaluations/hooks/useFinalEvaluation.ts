import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFinalEvaluation, saveFinalEvaluation } from '../api/final-evaluation.api';
import type { FinalEvaluationForm, FinalEvaluationWrite } from '../types';
import { finalistsKeys } from './useFinalists';

export const finalEvaluationKey = (projectId: string) =>
  ['evaluator', 'final-evaluation', projectId] as const;

/** Formulário da etapa final e a avaliação do avaliador para o projeto. */
export function useFinalEvaluation(projectId: string) {
  return useQuery({
    queryKey: finalEvaluationKey(projectId),
    queryFn: () => fetchFinalEvaluation(projectId),
    enabled: projectId !== '',
    retry: false,
  });
}

/** Guarda o preenchimento (IN_PROGRESS) ou envia a avaliação (FINALIZED). */
export function useSaveFinalEvaluation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FinalEvaluationWrite) => saveFinalEvaluation(projectId, input),
    onSuccess: (evaluation) => {
      queryClient.setQueryData<FinalEvaluationForm>(finalEvaluationKey(projectId), (current) =>
        current ? { ...current, evaluation } : current,
      );
      // Situação, nota e contadores da listagem de finalistas mudam com o envio.
      void queryClient.invalidateQueries({ queryKey: finalistsKeys.all });
    },
  });
}
