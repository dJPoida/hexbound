import { ComponentChildren, createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import type { NotificationPermission } from '../components/game/GameSettingsDialog/GameSettingsDialog';
import { pushService } from '../services/push.service';
import { settingsService } from '../services/settings.service';

const NOTIFICATION_PENDING_KEY = 'hexbound-notifications-pending-activation';

interface NotificationContextType {
  // State
  showNotificationsPrompt: boolean;
  notificationPermission: NotificationPermission;
  afterPromptAction: () => void;

  // Actions
  setShowNotificationsPrompt: (show: boolean) => void;
  setAfterPromptAction: (action: () => void) => void;
  checkNotificationStatusAndProceed: (onComplete: () => void) => Promise<void>;
  handleNotificationPromptComplete: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ComponentChildren;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [afterPromptAction, setAfterPromptAction] = useState<() => void>(() => {});

  // Initialize notification state
  useEffect(() => {
    // Check if we're returning from a permission change
    const isNotificationPending = sessionStorage.getItem(NOTIFICATION_PENDING_KEY);
    if (isNotificationPending) {
      sessionStorage.removeItem(NOTIFICATION_PENDING_KEY); // Clean up immediately
      if (Notification.permission === 'granted') {
        console.log(
          '[NotificationProvider] Resuming notification subscription after permission change.'
        );
        pushService
          .subscribeUser()
          .then(() => {
            settingsService.updateSettings({ notificationsEnabled: true });
          })
          .catch(err => console.error('Failed to auto-subscribe after permission change:', err));
      }
    }

    const syncNotificationPermission = () => {
      if (
        'Notification' in window &&
        settingsService.getSettings().notificationsEnabled &&
        Notification.permission === 'denied'
      ) {
        console.log(
          '[Permissions] Notification permission has been revoked by the user. Updating app settings.'
        );
        settingsService.updateSettings({ notificationsEnabled: false });
      }
    };

    // Run on initial load
    syncNotificationPermission();

    // Run whenever the tab becomes visible again
    document.addEventListener('visibilitychange', syncNotificationPermission);

    return () => {
      document.removeEventListener('visibilitychange', syncNotificationPermission);
    };
  }, []);

  const checkNotificationStatusAndProceed = async (onComplete: () => void) => {
    // Check if notifications are supported by the browser
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      onComplete();
      return;
    }

    const permission: NotificationPermission = Notification.permission as NotificationPermission;
    setNotificationPermission(permission); // Store the permission state
    const settings = settingsService.getSettings();

    if (permission === 'granted' && !settings.notificationsEnabled) {
      // Auto-subscribe user since they already gave permission
      try {
        await pushService.subscribeUser();
        settingsService.updateSettings({ notificationsEnabled: true });
      } catch (error) {
        console.error('Failed to auto-subscribe user:', error);
      }
      onComplete(); // Proceed regardless of subscription success
    } else if (
      permission === 'prompt' ||
      permission === 'default' ||
      (permission === 'denied' && !settings.notificationsEnabled)
    ) {
      // Show the prompt dialog if it hasn't been asked, or if it was denied and our in-app setting is off.
      if (permission === 'denied') {
        // Set the flag so we know to check for changes on next load
        sessionStorage.setItem(NOTIFICATION_PENDING_KEY, 'true');
      }
      setAfterPromptAction(() => onComplete);
      setShowNotificationsPrompt(true);
    } else {
      // Permission is 'denied' or already granted and enabled, just proceed
      onComplete();
    }
  };

  const handleNotificationPromptComplete = () => {
    setShowNotificationsPrompt(false);
    if (afterPromptAction) {
      afterPromptAction();
    }
  };

  const notificationValue: NotificationContextType = {
    showNotificationsPrompt,
    notificationPermission,
    afterPromptAction,
    setShowNotificationsPrompt,
    setAfterPromptAction,
    checkNotificationStatusAndProceed,
    handleNotificationPromptComplete,
  };

  return (
    <NotificationContext.Provider value={notificationValue}>
      {children}
    </NotificationContext.Provider>
  );
};
