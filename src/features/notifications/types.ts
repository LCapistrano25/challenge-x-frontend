/** Tipos de notificação, espelhando docs/api/openapi.yaml (schema Notification). */
export type NotificationType =
  'SYSTEM' | 'TEAM' | 'PROJECT' | 'DELIVERABLE' | 'EVALUATION' | 'RESULT' | 'CERTIFICATE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Destino relacionado (formato pendente, P-14). */
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsQuery {
  /** Parâmetro `unread` da API. */
  unread?: boolean;
  page?: number;
  page_size?: number;
}
