import { http } from '@/shared/lib/http';
import type { DeliveryEvaluationDetail, PublishEvaluationInput } from '../types';

/** GET /api/teacher/deliveries/{id} (x-status: proposed; alinhar com o openapi antes de integrar). */
export async function fetchDeliveryEvaluation(id: string): Promise<DeliveryEvaluationDetail> {
  const { data } = await http.get<DeliveryEvaluationDetail>(`/api/teacher/deliveries/${id}`);
  return data;
}

/** PUT /api/teacher/deliveries/{id}/evaluation: publica nota e feedback (x-status: proposed). */
export async function publishDeliveryEvaluation(
  id: string,
  input: PublishEvaluationInput,
): Promise<DeliveryEvaluationDetail> {
  const { data } = await http.put<DeliveryEvaluationDetail>(
    `/api/teacher/deliveries/${id}/evaluation`,
    input,
  );
  return data;
}
