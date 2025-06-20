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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return null;
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const publicKey = getVapidPublicKey();
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log('User is subscribed:', subscription);
      
      // Send subscription to the backend
      await authenticatedFetch(API_ROUTES.SUBSCRIBE_PUSH, {
        method: 'POST',
        body: JSON.stringify(subscription),
      });

      console.log('Push subscription sent to server.');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
      return null;
    }
  },
}; 