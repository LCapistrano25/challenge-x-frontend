import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDeliveryEvaluation, publishDeliveryEvaluation } from '../api/delivery-evaluation.api';
import type { PublishEvaluationInput } from '../types';
import { teacherDashboardKey } from './useTeacherDashboard';

export const deliveryEvaluationKey = (id: string) => ['deliveries', 'evaluation', id] as const;

export function useDeliveryEvaluation(id: string) {
  return useQuery({
    queryKey: deliveryEvaluationKey(id),
    queryFn: () => fetchDeliveryEvaluation(id),
    enabled: id !== '',
    retry: false,
  });
}

export function usePublishEvaluation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishEvaluationInput) => publishDeliveryEvaluation(id, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(deliveryEvaluationKey(id), detail);
      // O painel mostra a entrega como "Avaliado" assim que a avaliação é publicada.
      void queryClient.invalidateQueries({ queryKey: teacherDashboardKey });
    },
  });
}
