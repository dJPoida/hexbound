import { useEffect, useState } from 'preact/hooks';

import { pushService } from '../../../services/push.service';
import { settingsService } from '../../../services/settings.service';
import { Checkbox } from '../../ui/Checkbox';
import { Dialog } from '../../ui/Dialog/Dialog';
import { Heading } from '../../ui/Typography/Heading';
import { Text } from '../../ui/Typography/Text';
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
        console.error('Failed to complete push subscription process.', error);
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
        console.error('Failed to complete push un-subscription process.', error);
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
    <Dialog title='Game Settings' onClose={onClose}>
      <div class={styles.settingsSection}>
        <Heading level={3} variant='subSectionHeader' class={styles.sectionTitle}>
          Notifications
        </Heading>
        <Checkbox
          label='Enable Turn Notifications'
          checked={settings.notificationsEnabled}
          onChange={handleNotificationsEnabledChange}
          disabled={isNotificationToggleDisabled}
        />
        {(isSubscribing || permission === 'denied') && (
          <Text variant='caption' color='subtle' class={styles.settingDescription}>
            {isSubscribing && 'Subscribing...'}
            {permission === 'denied' && 'Notifications blocked. Enable in browser settings.'}
          </Text>
        )}
      </div>

      <div class={styles.settingsSection}>
        <Heading level={3} variant='subSectionHeader' class={styles.sectionTitle}>
          Display
        </Heading>
        <Checkbox
          label='Show Hex-Grid'
          checked={settings.showHexGrid}
          onChange={handleShowHexGridChange}
        />
      </div>

      <div class={styles.settingsSection}>
        <Heading level={3} variant='subSectionHeader' class={styles.sectionTitle}>
          Development
        </Heading>
        <Checkbox
          label='Show Debug Info'
          checked={settings.showDebugInfo}
          onChange={handleShowDebugInfoChange}
        />
      </div>
    </Dialog>
  );
};
