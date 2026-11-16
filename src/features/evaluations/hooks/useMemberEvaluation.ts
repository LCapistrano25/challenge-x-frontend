import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMemberNote, fetchMemberNotesSummary } from '../api/member-evaluation.api';
import type { MemberNoteCreate, MemberNoteSummary } from '../types';

export const memberNotesSummaryKey = (teamId: number) =>
  ['teams', teamId, 'member-notes', 'summary'] as const;

/** Integrantes já avaliados pelo líder (PROPOSTA: GET /member-notes/summary). */
export function useMemberNotesSummary(teamId: number | undefined, { enabled = true } = {}) {
  return useQuery({
    queryKey: memberNotesSummaryKey(teamId ?? 0),
    queryFn: () => fetchMemberNotesSummary(teamId as number),
    enabled: enabled && teamId != null,
  });
}

/**
 * Envia a avaliação (POST /member-notes). Ao concluir, marca o integrante como enviado no
 * resumo em cache, para o contador "X de Y avaliações enviadas" se atualizar na hora, e
 * recarrega o resumo do servidor.
 */
export function useCreateMemberNote(teamId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberNoteCreate) => createMemberNote(teamId, input),
    onSuccess: (created, input) => {
      queryClient.setQueryData<MemberNoteSummary[]>(memberNotesSummaryKey(teamId), (current) => [
        ...(current ?? []).filter((item) => item.member_id !== input.member_id),
        { member_id: input.member_id, created_at: created.created_at },
      ]);
      void queryClient.invalidateQueries({ queryKey: memberNotesSummaryKey(teamId) });
    },
  });
}
