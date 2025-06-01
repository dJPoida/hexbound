import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';
import * as webPushNamespace from 'web-push'; // Renamed for clarity

// Create a Redis client instance.
// Explicitly pass the REDIS_URL if it exists, otherwise ioredis defaults might apply
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();
if (!process.env.REDIS_URL) {
  console.warn('[API Module Scope] REDIS_URL is not set, ioredis will use default connection options. This message should not appear if Vercel env vars are loading.');
}

const COUNTER_KEY = 'game:counter'; // Define a key for storing the counter

// Use webPushNamespace.default and cast to any to handle potential CJS/ESM interop issues
const webPush = (webPushNamespace as any).default || webPushNamespace;

// Configure VAPID details
// Uses VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT from Vercel Dashboard (for vercel dev)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('[API Module Scope] VAPID details configured.');
  } catch (e: any) {
     console.error('[API Module Scope] Error configuring VAPID details:', e.message, e.stack ? e.stack.split('\n')[1].trim() : '');
  }
} else {
  console.error('[API Module Scope] Critical VAPID environment variables are missing. Push notifications will fail.');
}

// TEMPORARY: Hardcoded push subscription for testing
const testPushSubscription = {"endpoint":"https://fcm.googleapis.com/fcm/send/dpku74YMld4:APA91bEOgyV_Qrn2dfh_yXypggFMyZWmX4OHwzU9PqCe2TVrjJW0rnlvIl9YMd2GmwltMnpBvmNs8q1ScUFp1CbGtEzA94Vd_-xHjGHkkmWsb6g6zICF0S7A0f8Za9r0jvT9xkNVo86x","expirationTime":null,"keys":{"p256dh":"BO6oxSKnBS-oTPCbiRzYVRpM8MlgGN9ZsAmkp74w8215c34iFOK-B9Wclp2yAuQsdJdaylgJsTPiOePWPHuFdyA","auth":"baRqXe3l6TWhYmUrN7ejoQ"}};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  console.log('[Handler Scope] Env Vars: REDIS_URL=', process.env.REDIS_URL, ' VAPID_PUBLIC_KEY=', process.env.VAPID_PUBLIC_KEY, ' VAPID_PRIVATE_KEY=', process.env.VAPID_PRIVATE_KEY, ' VAPID_SUBJECT=', process.env.VAPID_SUBJECT);
  if (request.method === 'POST') {
    const { counter } = request.body;

    if (typeof counter !== 'number') {
      response.status(400).json({ message: 'Invalid counter value provided.' });
      return;
    }

    console.log('Received counter value for end turn:', counter);

    try {
      // Update counter in Redis
      await redis.set(COUNTER_KEY, counter);
      console.log('Counter updated in Redis:', counter);

      // Send web push notification
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
        try {
          const payload = JSON.stringify({ title: 'Hexbound Turn Update', body: `Counter is now ${counter}` });
          await webPush.sendNotification(testPushSubscription, payload);
          console.log('Push notification sent successfully.');
        } catch (pushError: any) {
          console.error('Error sending push notification (runtime):', pushError.message, pushError.stack ? pushError.stack.split('\n')[1].trim() : '');
        }
      } else {
        console.warn('Skipping push notification: VAPID environment variables not fully configured.');
      }

      response.status(200).json({ message: 'Turn ended, counter updated, push attempted.', newCounterValue: counter });
    } catch (error: any) {
      console.error('Error during end turn processing:', error.message);
      response.status(500).json({ message: 'Error processing turn.' });
    }
  } else {
    response.setHeader('Allow', ['POST']);
    response.status(405).end(`Method ${request.method} Not Allowed`);
  }
} 