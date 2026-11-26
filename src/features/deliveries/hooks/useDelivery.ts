import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  projectDeliverablesKey,
  useProjectDeliverables,
  useTeamProject,
  type DeliverableVersion,
  type StageDeliverable,
} from '@/features/projects';
import { studentDashboardKey, useStudentDashboard } from '@/features/teams';
import { submitDeliverableVersion } from '../api/deliveries.api';
import type { DeliverableSubmissionJson } from '../types';

/** Lê um id numérico da URL (?etapa=7, ?versao=77). */
export function useIdParam(name: string): number | null {
  const [params] = useSearchParams();
  const value = Number(params.get(name));
  return Number.isInteger(value) && value > 0 ? value : null;
}

/** Etapa escolhida na lista de entregas (?etapa=7). */
export const useStageParam = () => useIdParam('etapa');

/**
 * Dados das telas de entrega: painel do aluno (equipe e papel), projeto da equipe e a etapa
 * escolhida (GET /api/projects/{id}/deliverables).
 */
export function useDeliveryContext(stageId: number | null) {
  const dashboard = useStudentDashboard();
  const team = dashboard.data?.team ?? null;
  const project = useTeamProject(team?.id);
  const deliverables = useProjectDeliverables(project.data?.id ?? undefined);
  const items = deliverables.data ?? [];
  const item = stageId == null ? null : (items.find((entry) => entry.stage.id === stageId) ?? null);

  const loading =
    dashboard.isPending ||
    (team != null && project.isPending) ||
    (project.data != null && deliverables.isPending);
  const failed =
    (!dashboard.data && dashboard.isError) ||
    (team != null && project.data === undefined && project.isError) ||
    (project.data != null && !deliverables.data && deliverables.isError);

  function retry() {
    if (dashboard.isError) void dashboard.refetch();
    if (project.isError) void project.refetch();
    if (deliverables.isError) void deliverables.refetch();
  }

  return {
    loading,
    failed,
    retry,
    dashboard: dashboard.data,
    team,
    project: project.data ?? null,
    items,
    item,
  };
}

/**
 * Envia a entrega. Ao concluir, registra a nova versão no histórico em cache (a confirmação
 * mostra o envio na hora) e recarrega as entregas e o painel do aluno.
 */
export function useSubmitDelivery(projectId: number, stageId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FormData | DeliverableSubmissionJson) =>
      submitDeliverableVersion(projectId, stageId, body),
    onSuccess: (version: DeliverableVersion) => {
      queryClient.setQueryData<StageDeliverable[]>(projectDeliverablesKey(projectId), (current) =>
        current?.map((item) =>
          item.stage.id === stageId
            ? {
                ...item,
                status: 'SUBMITTED',
                versions: [version, ...item.versions.filter((v) => v.id !== version.id)],
              }
            : item,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: projectDeliverablesKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: studentDashboardKey });
    },
  });
}
