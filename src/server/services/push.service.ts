import webpush, { WebPushError } from 'web-push';

import config from '../config';
import { getDataSource } from '../data-source';
import { PushSubscription } from '../entities/PushSubscription.entity';

// Configure web-push with VAPID details, only if they are provided.
if (config.webpush.publicKey && config.webpush.privateKey) {
  webpush.setVapidDetails(
    config.webpush.subject,
    config.webpush.publicKey,
    config.webpush.privateKey
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export const pushService = {
  async sendNotification(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const subscriptionRepo = getDataSource().getRepository(PushSubscription);
      const subscriptions = await subscriptionRepo.find({ where: { userId } });

      if (subscriptions.length === 0) {
        console.log(`[PushService] No push subscriptions found for user ${userId}.`);
        return;
      }

      console.log(`[PushService] Sending notification to ${subscriptions.length} endpoint(s) for user ${userId}.`);

      const notificationPromises = subscriptions.map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
          .catch((error: unknown) => {
            // If a subscription is no longer valid, the push service returns a 410 Gone status.
            // We should remove it from our database.
            if (error instanceof WebPushError && error.statusCode === 410) {
              console.log(`[PushService] Subscription for user ${userId} has expired. Removing.`);
              return subscriptionRepo.delete({ id: sub.id });
            } else {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`[PushService] Failed to send notification to endpoint for user ${userId}:`, errorMessage);
            }
          });
      });

      await Promise.all(notificationPromises);
      console.log(`[PushService] Successfully processed notifications for user ${userId}.`);

    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[PushService] Database error while sending notifications for user ${userId}:`, errorMessage);
    }
  }
}; 