import { useEffect, useRef } from 'react';
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import type { Notification } from '@shared/schema';

export function NotificationManager() {
  const { data: notificationData } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const previousNotificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    if (!notificationData?.notifications) return;

    const currentNotifications = notificationData.notifications;
    const previousNotifications = previousNotificationsRef.current;

    // Trova le nuove notifiche (quelle che non erano nella lista precedente)
    const newNotifications = currentNotifications.filter(current => 
      !previousNotifications.find(prev => prev.id === current.id)
    );

    // Mostra toast per ogni nuova notifica
    newNotifications.forEach(notification => {
      // Determina il variant del toast basato sul tipo di notifica
      let variant: 'default' | 'destructive' = 'default';
      if (notification.type === 'ERROR') {
        variant = 'destructive';
      }

      toast({
        title: notification.title,
        description: notification.message,
        variant,
        duration: 10000, // 10 secondi come richiesto
        action: notification.isRead ? undefined : (
          <ToastAction altText="Marca come letta" onClick={() => markAsRead.mutate(notification.id)}>
            Marca come letta
          </ToastAction>
        ),
      });
    });

    // Aggiorna il riferimento alle notifiche precedenti
    previousNotificationsRef.current = currentNotifications;
  }, [notificationData?.notifications, markAsRead]);

  // Questo componente non renderizza nulla visivamente
  return null;
}