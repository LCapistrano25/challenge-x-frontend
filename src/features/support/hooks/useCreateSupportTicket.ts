import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupportTicket } from '../api/support.api';

export const supportTicketsKey = ['support', 'tickets'] as const;

/** "Falar com a organização": abre um chamado (POST /api/support/tickets, PROPOSTO). */
export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: supportTicketsKey }),
  });
}
