import './style.css';

const counterDisplay = document.getElementById('counter') as HTMLSpanElement;
const incrementButton = document.getElementById('incrementButton') as HTMLButtonElement;
const endTurnButton = document.getElementById('endTurnButton') as HTMLButtonElement;

let currentCounterValue = 0;

function updateCounterDisplay() {
  if (counterDisplay) {
    counterDisplay.textContent = currentCounterValue.toString();
  }
}

incrementButton?.addEventListener('click', () => {
  currentCounterValue++;
  updateCounterDisplay();
});

endTurnButton?.addEventListener('click', async () => {
  console.log('End Turn clicked. Current counter:', currentCounterValue);

  try {
    const response = await fetch('/api/end-turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ counter: currentCounterValue }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Server response:', data);
      // Here we would ideally get the new counter value from the server/push
      // For now, let's assume the server directly returns the new state or a push will handle it.
    } else {
      console.error('Error ending turn:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to send end turn request:', error);
  }
});

// Initialize display
updateCounterDisplay();

// --- Web Push Setup ---

// Function to convert VAPID public key string to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorkerAndSubscribeToPush() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported in this browser.');
    return;
  }
  if (!('PushManager' in window)) {
    console.error('Push API not supported in this browser.');
    return;
  }

  try {
    const swRegistration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', swRegistration);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return;
    }
    console.log('Notification permission granted.');

    // Get VAPID public key from environment variables
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not set in .env.local or .env');
      return;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push notifications
    const pushSubscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true, // Indicates that all push messages will result in a user-visible notification
      applicationServerKey: applicationServerKey,
    });

    console.log('User is subscribed to push notifications:', pushSubscription);
    console.log('Push Subscription JSON:', JSON.stringify(pushSubscription));

    // TODO: Send this pushSubscription object to your backend server
    // and store it associated with the user/player.
    // Example: await fetch('/api/save-subscription', { method: 'POST', body: JSON.stringify(pushSubscription), headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Service Worker registration or Push subscription failed:', error);
  }
}

// Run the setup
registerServiceWorkerAndSubscribeToPush();
