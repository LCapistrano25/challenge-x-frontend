import { http } from '@/shared/lib/http';
import type { SupportTicket, SupportTicketCreate } from '../types';

/**
 * POST /api/support/tickets — supportCreateTicket (RFXX, x-status: proposed, P-06/P-09/P-10/P-11).
 * Abre um chamado em nome do usuário autenticado (STUDENT ou TEACHER). Status inicial OPEN.
 */
export async function createSupportTicket(input: SupportTicketCreate): Promise<SupportTicket> {
  const { data } = await http.post<SupportTicket>('/api/support/tickets', input);
  return data;
}
