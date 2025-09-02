import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET;

export function createUserToken(userId: string): string {
  if (!secretKey) {
    console.error('JWT secret key is not defined');
    throw new Error('JWT secret key is not defined');
  }

  const token = jwt.sign({ userId }, secretKey, { expiresIn: '1d' });
  return token;
}