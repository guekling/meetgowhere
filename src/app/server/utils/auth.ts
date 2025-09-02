import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import { getUserById } from '../services/user';

const secretKey = process.env.JWT_SECRET;

export function createUserToken(userId: string): string {
  if (!secretKey) {
    console.error('JWT secret key is not defined');
    throw new Error('JWT secret key is not defined');
  }

  const token = jwt.sign({ userId }, secretKey, { expiresIn: '1d' });
  return token;
}

export async function getUserFromRequest(
  req: NextRequest
): Promise<{ userId: string; token: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('userToken');

  if (!token) return null;

  if (!secretKey) {
    console.error('JWT secret key is not defined');
    throw new Error('JWT secret key is not defined');
  }

  try {
    const decoded = jwt.verify(token.value, secretKey);

    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return { userId: (decoded as jwt.JwtPayload).userId, token: token.value };
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function isUserAuthenticated(
  req: NextRequest,
  reqSessionId: string
): Promise<boolean> {
  const user = await getUserFromRequest(req);
  const userInfo = await getUserById(user?.userId);
  const userSessionId = userInfo?.getDataValue('session_id');

  return user !== null && userSessionId === reqSessionId;
}
