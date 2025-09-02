import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { createUser } from '@/app/server/services/user';
import { ErrorDetails, ErrorType, SessionStatus, UserRoles } from '@/app/types/index';
import { createSession } from '@/app/server/services/session';

/**
 * POST /sessions → create session → {sessionId, inviteUrl}
 * body:
 *  - username: string
 *  - location: { lat: number, lng: number }
 * response:
 *  - sessionId: string
 *  - inviteToken: string
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, location } = body;

    const sessionId = uuidv4();
    const { userId, token } = await createUser(username, UserRoles.INITIATOR, sessionId, location);
    const session = await createSession(sessionId, userId);

    // @TODO crypto the invite token?

    const res = NextResponse.json({ sessionId, inviteToken: session.getDataValue('invite_token') });
    res.cookies.set('userToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 24 * 60 * 60, // 1 day
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('Error creating session:', error);

    const { message, status } = ErrorDetails[ErrorType.INTERNAL_SERVER_ERROR];
    return NextResponse.json({ error: message }, { status });
  }
}
