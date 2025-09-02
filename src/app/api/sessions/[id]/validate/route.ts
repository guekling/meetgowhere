import { NextRequest, NextResponse } from 'next/server';

import { ErrorDetails, ErrorType } from '@/app/types';
import { isSessionInvalid } from '@/app/server/services/session';

/**
 * GET /sessions/:id/validate?token=xxx → validate session
 * response:
 *   - 200: { message: 'ok' }
 *   - 401: { error: 'Missing invite token' }
 *   - 403: { error: 'Invalid invite token' }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const searchParams = request.nextUrl.searchParams;

  const sessionId = (await params).id;
  const token = searchParams.get('token');

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

  return NextResponse.json({ message: 'ok' });
}
