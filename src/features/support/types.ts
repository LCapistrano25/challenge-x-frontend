/**
 * Tipos do atendimento (docs/api/openapi.yaml, snake_case). POST /api/support/tickets é
 * PROPOSTO (P-06): os status e o mapeamento com os requisitos ainda podem mudar.
 */

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** SupportTicketCreate — POST /api/support/tickets */
export interface SupportTicketCreate {
  /** maxLength 150 */
  title: string;
  description: string;
}

/** SupportTicket */
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  support_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

/* --- Central de ajuda: perguntas frequentes (conteúdo estático, P-35) --- */

export type FaqTopicId = 'TEAM' | 'PROJECT';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqTopic {
  id: FaqTopicId;
  title: string;
  items: FaqItem[];
}
