import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRegulation,
  downloadRegulationFile,
  fetchRegulation,
  fetchRegulations,
  publishRegulation,
  updateRegulation,
  type RegulationDraftInput,
} from '../api/regulations.api';
import { sortRegulations } from '../lib/regulations';
import type { Regulation } from '../types';
import { adminEditionsKey } from './useAdminEdition';
import { setupKeys } from './useEvaluationSetup';

export const regulationKeys = {
  all: ['admin', 'regulations'] as const,
  list: () => [...regulationKeys.all, 'list'] as const,
  detail: (id: number) => [...regulationKeys.all, 'detail', id] as const,
};

/** Todas as versões de edital (a tela filtra por edição, situação e título). */
export function useRegulations() {
  return useQuery({
    queryKey: regulationKeys.list(),
    queryFn: () => fetchRegulations(),
    select: sortRegulations,
  });
}

export function useRegulation(regulationId: number | undefined) {
  return useQuery({
    queryKey: regulationKeys.detail(regulationId ?? 0),
    queryFn: () => fetchRegulation(regulationId!),
    enabled: regulationId !== undefined && Number.isFinite(regulationId),
  });
}

function useInvalidateRegulations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: regulationKeys.all });
}

export function useSaveRegulation() {
  const invalidate = useInvalidateRegulations();
  return useMutation({
    mutationFn: ({
      regulationId,
      editionId,
      input,
    }: {
      regulationId?: number;
      editionId: number;
      input: RegulationDraftInput;
    }) =>
      regulationId !== undefined
        ? updateRegulation(regulationId, input)
        : createRegulation(editionId, input),
    onSettled: invalidate,
  });
}

/** Publicar muda a situação da edição: as telas de configuração passam a só consulta. */
export function usePublishRegulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishRegulation,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: regulationKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminEditionsKey }),
        queryClient.invalidateQueries({ queryKey: setupKeys.all }),
      ]),
  });
}

/** Baixa o PDF da versão com a sessão do administrador (o arquivo não é público). */
export function useDownloadRegulation() {
  return useMutation({
    mutationFn: async (regulation: Regulation) => {
      const blob = await downloadRegulationFile(regulation.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = regulation.file.name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}
