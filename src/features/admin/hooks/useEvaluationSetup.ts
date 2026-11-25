import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  createCriterion,
  createStage,
  fetchEditionCriteria,
  fetchEditionStages,
  fetchStageCriteria,
  setStageCriteria,
  updateCriterion,
  updateStage,
} from '../api/evaluation-setup.api';
import { sortStages } from '../lib/stages';
import type {
  CriterionCreate,
  CriterionUpdate,
  StageCreate,
  StageCriteriaItem,
  StageCriterion,
  StageUpdate,
} from '../types';

export const setupKeys = {
  all: ['admin', 'evaluation-setup'] as const,
  stages: (editionId: number) => [...setupKeys.all, editionId, 'stages'] as const,
  criteria: (editionId: number) => [...setupKeys.all, editionId, 'criteria'] as const,
  stageCriteria: (stageId: number) => [...setupKeys.all, 'stage-criteria', stageId] as const,
};

/**
 * Etapas, critérios e a matriz de critérios de cada etapa pontuada da edição: a base das
 * telas de Etapas, Critérios, Rubricas e Pontuações.
 */
export function useEvaluationSetup(editionId: number | undefined) {
  const enabled = editionId !== undefined;
  const stagesQuery = useQuery({
    queryKey: setupKeys.stages(editionId ?? 0),
    queryFn: () => fetchEditionStages(editionId!),
    enabled,
    select: sortStages,
  });
  const criteriaQuery = useQuery({
    queryKey: setupKeys.criteria(editionId ?? 0),
    queryFn: () => fetchEditionCriteria(editionId!),
    enabled,
  });

  const stages = useMemo(() => stagesQuery.data ?? [], [stagesQuery.data]);
  const scored = stages.filter((stage) => stage.scored);
  const stageCriteriaQueries = useQueries({
    queries: scored.map((stage) => ({
      queryKey: setupKeys.stageCriteria(stage.id),
      queryFn: () => fetchStageCriteria(stage.id),
    })),
  });

  // Montado a cada render (poucas etapas); as telas não dependem da identidade do mapa.
  const stageCriteria = new Map<number, StageCriterion[]>();
  scored.forEach((stage, index) =>
    stageCriteria.set(stage.id, stageCriteriaQueries[index]?.data ?? []),
  );

  const queries = [stagesQuery, criteriaQuery, ...stageCriteriaQueries];
  const failed = queries.find((query) => query.isError);

  return {
    stages,
    criteria: criteriaQuery.data ?? [],
    stageCriteria,
    isLoading: enabled && queries.some((query) => query.isPending),
    isError: Boolean(failed),
    error: failed?.error ?? null,
    refetch: () => queries.forEach((query) => void query.refetch()),
  };
}

function useInvalidateSetup() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: setupKeys.all });
}

export function useCreateStage(editionId: number | undefined) {
  const invalidate = useInvalidateSetup();
  return useMutation({
    mutationFn: (input: StageCreate) => createStage(editionId!, input),
    onSettled: invalidate,
  });
}

export function useUpdateStage() {
  const invalidate = useInvalidateSetup();
  return useMutation({
    mutationFn: ({ stageId, input }: { stageId: number; input: StageUpdate }) =>
      updateStage(stageId, input),
    onSettled: invalidate,
  });
}

/** Grava várias etapas em sequência (a ordem importa: reduções antes dos aumentos). */
export function useUpdateStagesInSequence() {
  const invalidate = useInvalidateSetup();
  return useMutation({
    mutationFn: async (changes: { stageId: number; input: StageUpdate }[]) => {
      for (const change of changes) await updateStage(change.stageId, change.input);
    },
    onSettled: invalidate,
  });
}

export function useSetStageCriteria() {
  const invalidate = useInvalidateSetup();
  return useMutation({
    mutationFn: async (changes: { stageId: number; items: StageCriteriaItem[] }[]) => {
      for (const change of changes) await setStageCriteria(change.stageId, change.items);
    },
    onSettled: invalidate,
  });
}

export function useCreateCriterion(editionId: number | undefined) {
  const invalidate = useInvalidateSetup();
  return useMutation({
    mutationFn: (input: CriterionCreate) => createCriterion(editionId!, input),
    onSettled: invalidate,
  });
}

export function useUpdateCriterion() {
  const invalidate = useInvalidateSetup();
  return useMutation({
    mutationFn: ({ criterionId, input }: { criterionId: number; input: CriterionUpdate }) =>
      updateCriterion(criterionId, input),
    onSettled: invalidate,
  });
}
