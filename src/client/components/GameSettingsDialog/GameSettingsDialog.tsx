import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Dialog } from '../Dialog/Dialog';
import { Checkbox } from '../Checkbox/Checkbox';
import { settingsService } from '../../services/settings.service';
import styles from './GameSettingsDialog.module.css';

interface GameSettingsDialogProps {
  onClose: () => void;
}

type NotificationPermission = 'default' | 'granted' | 'denied';

export const GameSettingsDialog = ({ onClose }: GameSettingsDialogProps) => {
  const [settings, setSettings] = useState(settingsService.getSettings());
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Component did mount
    setPermission(Notification.permission);
    const unsubscribe = settingsService.subscribe(setSettings);
    // Component will unmount
    return () => unsubscribe();
  }, []);

  const handleNotificationsEnabledChange = async (checked: boolean) => {
    if (checked && Notification.permission !== 'granted') {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      if (newPermission !== 'granted') {
        // Don't enable if permission was denied
        return; 
      }
    }
    settingsService.updateSettings({ notificationsEnabled: checked });
  };
  
  const isNotificationToggleDisabled = permission === 'denied';

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
          {permission === 'denied' && (
            <span>Notifications are blocked by your browser. You must enable them in your browser settings to receive turn updates.</span>
          )}
          {permission === 'default' && (
            <span>This will ask for permission to show notifications.</span>
          )}
          {permission === 'granted' && !settings.notificationsEnabled && (
            <span>Notifications are allowed but currently disabled.</span>
          )}
           {permission === 'granted' && settings.notificationsEnabled && (
            <span>You will be notified when it&apos;s your turn.</span>
          )}
        </p>
      </div>
    </Dialog>
  );
}; 