import { Request, Response, NextFunction } from 'express';
import redisClient from '../redisClient';

// It's a common practice to extend the Express Request interface.
// This is declaration merging, which is a standard TypeScript feature.
// See: https://www.digitalocean.com/community/tutorials/how-to-add-custom-fields-to-the-request-object-in-express-with-typescript
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or improperly formatted.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing.' });
  }

  try {
    const sessionKey = `session:${token}`;
    const userId = await redisClient.get(sessionKey);

    console.log(`[Auth Middleware] Checking session key: ${sessionKey}, Found user ID: ${userId}`);

    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired session token.' });
    }

    // Attach user information to the response locals object
    res.locals.userId = userId;

    // Refresh the session expiration
    await redisClient.expire(sessionKey, 86400); // 24 hours

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({ message: 'Error validating session' });
  }
}; 