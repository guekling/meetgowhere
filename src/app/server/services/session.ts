import { v4 as uuidv4 } from 'uuid';

import db from '../db/models';
import { SessionStatus } from '@/app/types';
import { Session } from '../db/models/session';

export async function createSession(sessionId: string, userId: string): Promise<Session> {
  const inviteToken = uuidv4();
  const newSession = await db.Session.create({
    id: sessionId,
    status: SessionStatus.ACTIVE,
    invite_token: inviteToken,
    created_by: userId,
    created_at: new Date(),
  });

  return newSession;
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const session = await db.Session.findByPk(sessionId);
  return session;
}

export async function isSessionInvalid(sessionId: string, token: string): Promise<boolean> {
  const session = await getSessionById(sessionId);
  if (!session) return true;

  const isInvalid =
    session.getDataValue('status') !== SessionStatus.ACTIVE ||
    session.getDataValue('invite_token') !== token;

  return isInvalid;
}
