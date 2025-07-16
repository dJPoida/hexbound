import { Request, Response } from 'express';
import { ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { AppDataSource } from '../data-source';
import { PushSubscription as PushSubscriptionEntity } from '../entities/PushSubscription.entity';
import { User } from '../entities/User.entity';
import redisClient from '../redisClient';

const SESSION_EXPIRATION_SECONDS = 86400; // 24 hours

export const loginOrRegisterUser = async (req: Request, res: Response) => {
  const { userName } = req.body;

  if (
    !userName ||
    typeof userName !== 'string' ||
    userName.trim().length === 0 ||
    userName.length > 20
  ) {
    return res
      .status(400)
      .json({
        message:
          'Username is required, must be a non-empty string, and cannot exceed 20 characters.',
      });
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { userName: ILike(userName.trim()) } });

    if (!user) {
      // User does not exist, so create a new one
      user = userRepository.create({ userName: userName.trim() });
      await userRepository.save(user);
      console.log(`[Login] New user created: ${user.userName}, ID: ${user.userId}`);
    } else {
      console.log(`[Login] Existing user logged in: ${user.userName}, ID: ${user.userId}`);
    }

    // Create a session token
    const sessionToken = uuidv4();
    const sessionKey = `session:${sessionToken}`;

    // Store the session in Redis
    await redisClient.set(sessionKey, user.userId, {
      EX: SESSION_EXPIRATION_SECONDS,
    });

    res.status(200).json({
      userId: user.userId,
      userName: user.userName,
      sessionToken: sessionToken,
    });
  } catch (error) {
    console.error('[API /login] Error:', error);
    res
      .status(500)
      .json({ message: 'Error processing user login', error: (error as Error).message });
  }
};

export const subscribeToPushNotifications = async (req: Request, res: Response) => {
  const userId = res.locals.userId; // Provided by auth middleware
  const subscription = req.body;

  console.log(`[API /subscribe-push] Received subscription request for user: ${userId}`);

  if (!userId) {
    console.error(`[API /subscribe-push] Aborting: userId is missing from the request.`);
    return res.status(401).json({ message: 'Authentication error: User ID is missing.' });
  }

  console.log(`[API /subscribe-push] Endpoint: ${subscription.endpoint}`);

  if (!subscription || !subscription.endpoint) {
    console.error(`[API /subscribe-push] Invalid subscription object for user: ${userId}`);
    return res.status(400).json({ message: 'Invalid push subscription object.' });
  }

  try {
    const pushSubscriptionRepo = AppDataSource.getRepository(PushSubscriptionEntity);
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remove existing subscriptions for the same endpoint to avoid duplicates
    await pushSubscriptionRepo.delete({ endpoint: subscription.endpoint });
    console.log(
      `[API /subscribe-push] Removed any existing subscriptions for endpoint: ${subscription.endpoint}`
    );

    const newSubscription = pushSubscriptionRepo.create({
      user: user,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    await pushSubscriptionRepo.save(newSubscription);
    console.log(`[API /subscribe-push] Successfully saved new subscription for user: ${userId}`);

    res.status(201).json({ message: 'Successfully subscribed to push notifications.' });
  } catch (error) {
    console.error('[API /subscribe-push] Error:', error);

    // Define a type for the error object with a 'code' property
    type DatabaseError = { code?: string };

    // Unique constraint violation (Postgres error code for unique_violation)
    if ((error as DatabaseError).code === '23505') {
      return res.status(409).json({ message: 'This subscription endpoint is already registered.' });
    }
    res
      .status(500)
      .json({
        message: 'Failed to subscribe to push notifications.',
        error: (error as Error).message,
      });
  }
};

export const unsubscribeFromPushNotifications = async (req: Request, res: Response) => {
  const userId = res.locals.userId;
  const { endpoint } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication error: User ID is missing.' });
  }

  if (!endpoint) {
    return res.status(400).json({ message: 'Push subscription endpoint is required.' });
  }

  try {
    const pushSubscriptionRepo = AppDataSource.getRepository(PushSubscriptionEntity);

    // We can delete directly based on the unique endpoint.
    // We could also add a check to ensure it belongs to the authenticated user, but the endpoint itself is a strong enough key.
    const deleteResult = await pushSubscriptionRepo.delete({ endpoint: endpoint });

    if (deleteResult.affected === 0) {
      // This isn't necessarily an error, the subscription might have been removed already.
      console.log(`[API /unsubscribe-push] No subscription found for endpoint. Nothing to delete.`);
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    console.log(
      `[API /unsubscribe-push] Successfully removed subscription for user ${userId} with endpoint ${endpoint}`
    );
    res.status(200).json({ message: 'Successfully unsubscribed from push notifications.' });
  } catch (error) {
    console.error('[API /unsubscribe-push] Error:', error);
    res
      .status(500)
      .json({
        message: 'Failed to unsubscribe from push notifications.',
        error: (error as Error).message,
      });
  }
};
