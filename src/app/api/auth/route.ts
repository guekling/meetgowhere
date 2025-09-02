import { getUserById } from '@/app/server/services/user';
import { getUserFromRequest } from '@/app/server/utils/auth';
import { ErrorDetails, ErrorType } from '@/app/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      console.error('User is not authenticated');

      const { message, status } = ErrorDetails[ErrorType.UNAUTHORIZED];
      return NextResponse.json({ error: message }, { status });
    }

    const userInfo = await getUserById(user.userId);

    return NextResponse.json({
      user: {
        username: userInfo.getDataValue('username'),
        role: userInfo.getDataValue('role'),
        sessionId: userInfo.getDataValue('session_id'),
      },
    });
  } catch (error) {
    console.error('Error fetching user information:', error);

    const { message, status } = ErrorDetails[ErrorType.INTERNAL_SERVER_ERROR];
    return NextResponse.json({ error: message }, { status });
  }
}
