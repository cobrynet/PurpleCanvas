import { Button } from '@/components/ui/button';
import { useSendNotification } from '@/hooks/useNotifications';

export function NotificationTestButton() {
  const sendNotification = useSendNotification();

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const handleTestNotification = () => {
    sendNotification.mutate({
      type: 'INFO',
      title: 'Test Notifica Sistema',
      message: 'Questa è una notifica di test per verificare il funzionamento del sistema di notifiche persistenti.'
    });
  };

  return (
    <Button 
      onClick={handleTestNotification}
      disabled={sendNotification.isPending}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-background border-2 border-primary"
      data-testid="test-notification-button"
    >
      {sendNotification.isPending ? 'Inviando...' : 'Test Notifica'}
    </Button>
  );
}