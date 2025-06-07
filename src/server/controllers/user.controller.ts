import { Request, Response } from 'express';
import { ILike } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User.entity';

export const loginOrRegisterUser = async (req: Request, res: Response) => {
  const { userName } = req.body;

  if (!userName || typeof userName !== 'string' || userName.trim().length === 0 || userName.length > 20) {
    return res.status(400).json({ message: 'Username is required, must be a non-empty string, and cannot exceed 20 characters.' });
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

    res.status(200).json({ userId: user.userId, userName: user.userName });

  } catch (error) {
    console.error('[API /login] Error:', error);
    res.status(500).json({ message: 'Error processing user login', error: (error as Error).message });
  }
}; 