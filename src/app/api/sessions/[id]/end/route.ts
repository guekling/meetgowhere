import { endSession, isSessionActive } from '@/app/server/services/session';
import { isUserAnInitiator } from '@/app/server/services/user';
import { getUserFromRequest } from '@/app/server/utils/auth';
import { ErrorDetails, ErrorType } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionId = (await params).id;

  try {
    if (!(await isSessionActive(sessionId))) {
      console.error('Invalid session');
      const { message, status } = ErrorDetails[ErrorType.INVALID_SESSION];
      return NextResponse.json({ error: message }, { status });
    }

    const user = await getUserFromRequest();

    if (!user || !(await isUserAnInitiator(user.userId))) {
      console.error('User is not authenticated');
      const { message, status } = ErrorDetails[ErrorType.UNAUTHORIZED];
      return NextResponse.json({ error: message }, { status });
    }

    const updatedSession = await endSession(sessionId);

    return NextResponse.json({ session: updatedSession }, { status: 200 });
  } catch (error) {
    console.error('Error ending session:', error);

    const { message, status } = ErrorDetails[ErrorType.INTERNAL_SERVER_ERROR];
    return NextResponse.json({ error: message }, { status });
  }
}
