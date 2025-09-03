import { getSessionById, getSessionInformation } from '@/app/server/services/session';
import { isUserAuthenticated } from '@/app/server/utils/auth';
import { ErrorDetails, ErrorType } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /sessions/:id → session info
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await params).id;

    const session = await getSessionById(sessionId);
    if (!session) {
      console.error('Invalid session');
      const { message, status } = ErrorDetails[ErrorType.INVALID_SESSION];
      return NextResponse.json({ error: message }, { status });
    }

    if (!(await isUserAuthenticated(request, sessionId))) {
      console.error('User is not authenticated');
      const { message, status } = ErrorDetails[ErrorType.UNAUTHORIZED];
      return NextResponse.json({ error: message }, { status });
    }

    const sessionInfo = await getSessionInformation(sessionId);

    return NextResponse.json({ session: sessionInfo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);

    const { message, status } = ErrorDetails[ErrorType.INTERNAL_SERVER_ERROR];
    return NextResponse.json({ error: message }, { status });
  }
}
