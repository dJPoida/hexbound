import { authenticatedFetch } from './api.service';
import { API_ROUTES } from '../../shared/constants/api.const';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getVapidPublicKey = (): string => {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is not set in the environment.');
  }
  return key;
};

export const pushService = {
  async subscribeUser(): Promise<PushSubscription | null> {
    console.log('[PushService] Starting subscription process...');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PushService] Push messaging is not supported in this browser.');
      return null;
    }

    try {
      console.log('[PushService] Waiting for service worker to be ready...');
      const swRegistration = await navigator.serviceWorker.ready;
      console.log('[PushService] Service worker is ready. Subscribing with push manager...');

      const publicKey = getVapidPublicKey();
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log('[PushService] User is subscribed:', subscription);
      
      // Send subscription to the backend
      console.log('[PushService] Sending subscription to backend...');
      await authenticatedFetch(API_ROUTES.SUBSCRIBE_PUSH, {
        method: 'POST',
        body: JSON.stringify(subscription),
      });

      console.log('[PushService] Push subscription sent to server successfully.');
      return subscription;
    } catch (error) {
      console.error('[PushService] Failed to subscribe the user: ', error);
      return null;
    }
  },

  async unsubscribeUser(): Promise<boolean> {
    console.log('[PushService] Starting unsubscription process...');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PushService] Push messaging is not supported.');
      return false;
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const subscription = await swRegistration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[PushService] No active subscription to unsubscribe.');
        return true; // Already unsubscribed
      }

      // Tell our backend to remove the subscription
      await authenticatedFetch(API_ROUTES.UNSUBSCRIBE_PUSH, {
        method: 'POST',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      console.log('[PushService] Unsubscription request sent to server.');
      
      // Unsubscribe from the browser's push manager
      const unsubscribed = await subscription.unsubscribe();
      if (unsubscribed) {
        console.log('[PushService] Successfully unsubscribed from browser push manager.');
      } else {
        console.warn('[PushService] Failed to unsubscribe from browser push manager.');
      }

      return unsubscribed;
    } catch (error) {
      console.error('[PushService] Failed to unsubscribe the user: ', error);
      return false;
    }
  }
}; 