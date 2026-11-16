import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead } from '../api/notifications.api';
import type { NotificationsQuery } from '../types';

export const notificationsKey = ['notifications'] as const;

export function useNotifications(params: NotificationsQuery = {}) {
  return useQuery({
    queryKey: [...notificationsKey, params],
    queryFn: () => fetchNotifications(params),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
