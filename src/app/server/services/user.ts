import db from '../db/models';
import { UserRoles, LocationInfo } from '../../types';
import { createUserToken } from '../utils/auth';

export async function createUser(
  username: string,
  role: UserRoles,
  sessionId: string,
  location?: LocationInfo
): Promise<{ userId: string; token: string }> {
  try {
    const user = await db.User.create({
      username,
      role,
      session_id: sessionId,
      created_at: new Date(),
      location,
    });

    const userId = user.getDataValue('id');
    const token = createUserToken(userId);

    return { userId, token };
  } catch (error) {
    throw new Error('Failed to create user');
  }
}