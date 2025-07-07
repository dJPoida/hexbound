import { h } from 'preact';
import { useEffect,useState } from 'preact/hooks';

import { pushService } from '../../services/push.service';
import { settingsService } from '../../services/settings.service';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dialog } from '../Dialog/Dialog';
import styles from './GameSettingsDialog.module.css';

interface GameSettingsDialogProps {
  onClose: () => void;
}

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'prompt';

export const GameSettingsDialog = ({ onClose }: GameSettingsDialogProps) => {
  const [settings, setSettings] = useState(settingsService.getSettings());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Component did mount
    setPermission(Notification.permission);
    const unsubscribe = settingsService.subscribe(setSettings);
    // Component will unmount
    return () => unsubscribe();
  }, []);

  const handleNotificationsEnabledChange = async (checked: boolean) => {
    // If the user is trying to enable notifications
    if (checked) {
      // First, check for browser-level permission if not already granted
      if (Notification.permission !== 'granted') {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission !== 'granted') {
          return; // Bail out if permission is denied
        }
      }
      
      // Now, subscribe to the push service and send to backend
      setIsSubscribing(true);
      try {
        await pushService.subscribeUser();
        // Only update our app's setting if the subscription was successful
        settingsService.updateSettings({ notificationsEnabled: true });
      } catch (error) {
        console.error("Failed to complete push subscription process.", error);
        // Optionally, show an error to the user in the dialog
      } finally {
        setIsSubscribing(false);
      }
    } else {
      // If the user is disabling notifications
      setIsSubscribing(true);
      try {
        await pushService.unsubscribeUser();
        // This will update the UI via the subscription
        settingsService.updateSettings({ notificationsEnabled: false });
      } catch (error) {
        console.error("Failed to complete push unsubscription process.", error);
      } finally {
        setIsSubscribing(false);
      }
    }
  };

  const handleShowHexGridChange = (checked: boolean) => {
    settingsService.updateSettings({ showHexGrid: checked });
  };

  const handleShowDebugInfoChange = (checked: boolean) => {
    settingsService.updateSettings({ showDebugInfo: checked });
  };
  
  const isNotificationToggleDisabled = permission === 'denied' || isSubscribing;

  return (
    <Dialog title="Game Settings" onClose={onClose}>
      <div class={styles.settingsSection}>
        <h3 class={styles.sectionTitle}>Notifications</h3>
        <Checkbox
          label="Enable Turn Notifications"
          checked={settings.notificationsEnabled}
          onChange={handleNotificationsEnabledChange}
          disabled={isNotificationToggleDisabled}
        />
        <p class={styles.settingDescription}>
          {isSubscribing && (
            <span>Subscribing...</span>
          )}
          {!isSubscribing && permission === 'denied' && (
            <span>Notifications are blocked by your browser. You must enable them in your browser settings to receive turn updates.</span>
          )}
          {!isSubscribing && permission === 'default' && (
            <span>This will ask for permission to show notifications.</span>
          )}
          {!isSubscribing && permission === 'granted' && !settings.notificationsEnabled && (
            <span>Notifications are allowed but currently disabled.</span>
          )}
           {!isSubscribing && permission === 'granted' && settings.notificationsEnabled && (
            <span>You will be notified when it&apos;s your turn.</span>
          )}
        </p>
      </div>

      <div class={styles.settingsSection}>
        <h3 class={styles.sectionTitle}>Display</h3>
        <Checkbox
          label="Show Hex-Grid"
          checked={settings.showHexGrid}
          onChange={handleShowHexGridChange}
        />
        <p class={styles.settingDescription}>
          Display the hex grid outline on all tiles.
        </p>
      </div>

      <div class={styles.settingsSection}>
        <h3 class={styles.sectionTitle}>Development</h3>
        <Checkbox
          label="Show Debug Info"
          checked={settings.showDebugInfo}
          onChange={handleShowDebugInfoChange}
        />
        <p class={styles.settingDescription}>
          Show debug information including tile coordinates and enable debug controls.
        </p>
      </div>
    </Dialog>
  );
}; 