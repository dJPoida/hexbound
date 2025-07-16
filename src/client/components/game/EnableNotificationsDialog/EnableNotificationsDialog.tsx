import { useEffect,useState } from 'preact/hooks';

import { pushService } from '../../../services/push.service';
import { settingsService } from '../../../services/settings.service';
import { StyleColor } from '../../../types/ui';
import type { NotificationPermission } from '../../game/GameSettingsDialog/GameSettingsDialog';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog/Dialog';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Typography/Text';
import styles from './EnableNotificationsDialog.module.css';

interface EnableNotificationsDialogProps {
  onComplete: () => void;
  permissionState: NotificationPermission;
}

export const EnableNotificationsDialog = ({ onComplete, permissionState }: EnableNotificationsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPermission, setCurrentPermission] = useState<NotificationPermission>(permissionState);

  // Update permission state when it changes
  useEffect(() => {
    const checkPermission = () => {
      if ('Notification' in window) {
        setCurrentPermission(Notification.permission as NotificationPermission);
      }
    };

    // Check immediately and set up listener for permission changes
    checkPermission();
    const interval = setInterval(checkPermission, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableClick = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications.');
      }

      // If permission is already granted, just subscribe
      if (currentPermission === 'granted') {
        const subscription = await pushService.subscribeUser();
        if (subscription) {
          settingsService.updateSettings({ notificationsEnabled: true });
          onComplete();
        } else {
          throw new Error('Failed to create push subscription.');
        }
        return;
      }

      // Request permission and subscribe
      const subscription = await pushService.subscribeUser();
      if (subscription) {
        settingsService.updateSettings({ notificationsEnabled: true });
        onComplete();
      } else {
        // Handle different rejection scenarios
        if (currentPermission === 'denied') {
          setError('Notifications are blocked. Please enable them in your browser settings and try again.');
        } else {
          setError('Permission was not granted. You can enable notifications later in Game Settings.');
        }
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipClick = () => {
    settingsService.updateSettings({ notificationsEnabled: false });
    onComplete();
  };

  const isEnableButtonDisabled = isLoading || currentPermission === 'denied';

  const footer = (
    <div class={styles.footerActions}>
      <Button onClick={handleSkipClick} color={StyleColor.DEFAULT}>
        Skip For Now
      </Button>
      <Button onClick={handleEnableClick} color={StyleColor.AMBER} disabled={isEnableButtonDisabled}>
        {isLoading ? 'Enabling...' : 'Enable Notifications'}
      </Button>
    </div>
  );

  return (
    <Dialog title="Get Turn Alerts!" footer={footer}>
      <Text variant="body">
        Hexbound is best with notifications enabled. We&apos;ll send you a quick alert when it&apos;s your turn to make a move.
      </Text>
      
      {currentPermission === 'denied' && (
        <div class={styles.warningContainer}>
          <Text as="div" class={styles.warningText}>
            <Icon name="alert-triangle" color={StyleColor.PURPLE} />
            Your browser is currently blocking notifications. To enable them, please click the lock icon in your address bar and change the permission.
          </Text>
        </div>
      )}
      
      <Text variant="caption" color="subtle">
        This helps keep the game moving and ensures you don&apos;t miss out on the action! You can change this setting at any time.
      </Text>
      
      {error && (
        <Text as="div" class={styles.errorText}>
          {error}
        </Text>
      )}
    </Dialog>
  );
}; 