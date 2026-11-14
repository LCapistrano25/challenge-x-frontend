import { http } from '@/shared/lib/http';
import type { Paginated } from '@/shared/types/api';
import type { Notification, NotificationsQuery } from '../types';

/** GET /api/notifications — notificationsList (mais recentes primeiro). */
export async function fetchNotifications(params: NotificationsQuery = {}) {
  const { data } = await http.get<Paginated<Notification>>('/api/notifications', { params });
  return data;
}

/** POST /api/notifications/{notification_id}/read — notificationsMarkRead (idempotente). */
export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const { data } = await http.post<Notification>(`/api/notifications/${notificationId}/read`);
  return data;
}
