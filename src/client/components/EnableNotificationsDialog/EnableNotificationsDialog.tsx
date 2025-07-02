import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Dialog } from '../Dialog/Dialog';
import { Button } from '../Button/Button';
import styles from './EnableNotificationsDialog.module.css';
import { pushService } from '../../services/push.service';
import { settingsService } from '../../services/settings.service';
import type { NotificationPermission } from '../GameSettingsDialog/GameSettingsDialog';

interface EnableNotificationsDialogProps {
  onComplete: () => void;
  permissionState: NotificationPermission;
}

export const EnableNotificationsDialog = ({ onComplete, permissionState }: EnableNotificationsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnableClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This will trigger the browser's permission prompt
      const subscription = await pushService.subscribeUser();
      if (subscription) {
        // If subscription was successful (i.e., user clicked "Allow")
        settingsService.updateSettings({ notificationsEnabled: true });
        onComplete();
      } else {
        // User may have clicked "Block" or closed the prompt
        setError('Permission was not granted. You can enable notifications later in the Game Settings.');
        // We don't call onComplete here, let them read the error and click "Skip"
      }
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipClick = () => {
    onComplete();
  };

  const isEnableButtonDisabled = isLoading || permissionState === 'denied';

  const footer = (
    <div class={styles.footerActions}>
        <Button onClick={handleSkipClick} variant="secondary">
            Skip For Now
        </Button>
        <Button onClick={handleEnableClick} variant="primary" disabled={isEnableButtonDisabled}>
            {isLoading ? 'Subscribing...' : 'Enable Notifications'}
        </Button>
    </div>
  );

  return (
    <Dialog title="Get Turn Alerts!" footer={footer}>
      <p class={styles.dialogText}>
        Hexbound is best with notifications enabled. We&apos;ll send you a quick alert when it&apos;s your turn to make a move.
      </p>
      {permissionState === 'denied' && (
        <p class={styles.warningText}>
          <i class="hbi hbi-alert-triangle" />
          Your browser is currently blocking notifications. To enable them, please click the lock icon in your address bar and change the permission.
        </p>
      )}
      <p class={styles.dialogSubtext}>
        This helps keep the game moving and ensures you don&apos;t miss out on the action! You can change this setting at any time.
      </p>
      {error && <p class={styles.errorText}>{error}</p>}
    </Dialog>
  );
}; 