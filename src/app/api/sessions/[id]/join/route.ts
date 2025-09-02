import { NextRequest, NextResponse } from 'next/server';

import { getUserFromRequest } from '@/app/server/utils/auth';
import { ErrorDetails, ErrorType, SessionStatus, UserRoles } from '@/app/types';
import { createUser } from '@/app/server/services/user';
import { isSessionInvalid } from '@/app/server/services/session';

/**
 * POST /sessions/:id/join?token=xxx → join session
 * auth:
 *  - (optional) user is authenticated
 *    - user authenticated → do nothing
 *    - user not authenticated → create user
 *  - user must have a valid invite token for a valid session
 * body:
 *  - username: string
 *  - location: { lat: number, lng: number }
 * response:
 *  - message: string
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const searchParams = request.nextUrl.searchParams;
  const body = await request.json();

  const sessionId = (await params).id;
  const { username, location } = body;
  const token = searchParams.get('token');

  try {
    if (!token) {
      console.error('Missing invite token');
      const { message, status } = ErrorDetails[ErrorType.MISSING_INVITE_TOKEN];
      return NextResponse.json({ error: message }, { status });
    }

    if (await isSessionInvalid(sessionId, token)) {
      console.error('Invalid invite token');
      const { message, status } = ErrorDetails[ErrorType.INVALID_INVITE_TOKEN];
      return NextResponse.json({ error: message }, { status });
    }

    const user = await getUserFromRequest(request);

    let newToken = user?.token;
    if (!user?.userId) {
      const { token: createdToken } = await createUser(
        username,
        UserRoles.PARTICIPANT,
        sessionId,
        location
      );
      newToken = createdToken;
    }

    const res = NextResponse.json({ message: 'ok' });
    res.cookies.set('userToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 24 * 60 * 60, // 1 day
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('Error joining session:', error);

    const { message, status } = ErrorDetails[ErrorType.INTERNAL_SERVER_ERROR];
    return NextResponse.json({ error: message }, { status });
  }
}
