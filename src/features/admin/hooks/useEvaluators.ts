import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchActiveCourses,
  fetchEditionEvaluators,
  fetchEditionTeams,
  fetchExternalEvaluators,
  inviteEvaluator,
  linkEditionEvaluator,
  resendInvitation,
  setEvaluatorAssignments,
  updateEditionEvaluator,
} from '../api/evaluators.api';
import { sortEvaluators } from '../lib/evaluators';
import type {
  EditionEvaluatorUpdate,
  EvaluatorAssignmentItem,
  EvaluatorInvitationCreate,
} from '../types';

export const evaluatorKeys = {
  all: ['admin', 'evaluators'] as const,
  edition: (editionId: number) => [...evaluatorKeys.all, 'edition', editionId] as const,
  catalog: (search: string) => [...evaluatorKeys.all, 'catalog', search] as const,
  teams: (editionId: number) => ['admin', 'teams', editionId] as const,
  courses: ['admin', 'courses', 'active'] as const,
};

/** Avaliadores vinculados à edição, em ordem alfabética. */
export function useEditionEvaluators(editionId: number | undefined) {
  return useQuery({
    queryKey: evaluatorKeys.edition(editionId ?? 0),
    queryFn: () => fetchEditionEvaluators(editionId!),
    enabled: editionId !== undefined,
    select: sortEvaluators,
  });
}

export function useEvaluatorCatalog(search: string, enabled: boolean) {
  return useQuery({
    queryKey: evaluatorKeys.catalog(search),
    queryFn: () => fetchExternalEvaluators(search),
    enabled,
    select: (page) => page.results,
  });
}

export function useEditionTeams(editionId: number | undefined) {
  return useQuery({
    queryKey: evaluatorKeys.teams(editionId ?? 0),
    queryFn: () => fetchEditionTeams(editionId!),
    enabled: editionId !== undefined,
  });
}

export function useActiveCourses() {
  return useQuery({ queryKey: evaluatorKeys.courses, queryFn: fetchActiveCourses });
}

function useInvalidateEvaluators() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: evaluatorKeys.all });
}

export function useInviteEvaluator() {
  const invalidate = useInvalidateEvaluators();
  return useMutation({
    mutationFn: ({ editionId, input }: { editionId: number; input: EvaluatorInvitationCreate }) =>
      inviteEvaluator(editionId, input),
    onSettled: invalidate,
  });
}

export function useLinkEvaluator() {
  const invalidate = useInvalidateEvaluators();
  return useMutation({
    mutationFn: ({
      editionId,
      evaluatorId,
      courseId,
    }: {
      editionId: number;
      evaluatorId: number;
      courseId: number | null;
    }) => linkEditionEvaluator(editionId, { evaluator_id: evaluatorId, course_id: courseId }),
    onSettled: invalidate,
  });
}

export function useResendInvitation() {
  const invalidate = useInvalidateEvaluators();
  return useMutation({
    mutationFn: ({ editionId, evaluatorId }: { editionId: number; evaluatorId: number }) =>
      resendInvitation(editionId, evaluatorId),
    onSettled: invalidate,
  });
}

/** Salva o vínculo e, se liberadas, as atribuições (nessa ordem). */
export function useSaveEvaluatorLink() {
  const invalidate = useInvalidateEvaluators();
  return useMutation({
    mutationFn: async ({
      editionId,
      evaluatorId,
      link,
      assignments,
    }: {
      editionId: number;
      evaluatorId: number;
      link: EditionEvaluatorUpdate | null;
      assignments: EvaluatorAssignmentItem[] | null;
    }) => {
      if (link) await updateEditionEvaluator(editionId, evaluatorId, link);
      if (assignments) await setEvaluatorAssignments(editionId, evaluatorId, assignments);
    },
    onSettled: invalidate,
  });
}
