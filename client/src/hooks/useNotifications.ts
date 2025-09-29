import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Notification, InsertNotification } from '@shared/schema';

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface SendNotificationData {
  userId: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
}

// Hook per recuperare le notifiche
export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ['/api/notifications'],
    refetchInterval: 10000, // Refresh ogni 10 secondi per aggiornare le notifiche
  });
}

// Hook per inviare una notifica
export function useSendNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SendNotificationData) => {
      const response = await apiRequest('/api/notifications/send', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalida e ricarica le notifiche dopo l'invio
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

// Hook per marcare una notifica come letta
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest(`/api/notifications/${notificationId}/read`, 'PATCH');
      return response.json();
    },
    onSuccess: () => {
      // Invalida e ricarica le notifiche dopo aver marcato come letta
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

// Hook per ottenere solo il count delle notifiche non lette (per il badge)
export function useUnreadNotificationsCount() {
  const { data } = useNotifications();
  return data?.unreadCount || 0;
}