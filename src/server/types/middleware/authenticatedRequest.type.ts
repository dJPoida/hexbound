import { Request } from 'express';

// Extend Express Request to include authenticated user information
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}
