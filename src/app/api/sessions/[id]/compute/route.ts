import { NextRequest, NextResponse } from 'next/server';

import { ErrorDetails, ErrorType } from '@/app/types';
import {
  computeLocation,
  getSessionUserLocations,
  hasComputedLocation,
  isSessionActive,
} from '@/app/server/services/session';
import { getUserFromRequest } from '@/app/server/utils/auth';
import { isUserAnInitiator } from '@/app/server/services/user';

/**
 * POST /api/sessions/[id]/compute → compute geometric median
 * auth:
 *  - user must be authenticated
 *  - user must be the session initiator
 *  - session must be valid
 * response:
 *  - 200: { computedLocation }
 *  - 400: { error: Invalid Invite Token }
 *  - 403: { error: Unauthorized }
 *  - 400: { error: Bad Request }
 *
 * requirements:
 *  - must have more than 2 users with locations saved in compute
 *  - session must not be already computed
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (await hasComputedLocation(sessionId)) {
      console.error('Location has already been computed');

      const { message, status } = ErrorDetails[ErrorType.BAD_REQUEST];
      return NextResponse.json({ error: message }, { status });
    }

    const locations = await getSessionUserLocations(sessionId);

    if (!locations || locations.length === 0) {
      console.error('No users found in session');

      const { message, status } = ErrorDetails[ErrorType.BAD_REQUEST];
      return NextResponse.json({ error: message }, { status });
    }

    if (locations.length < 2) {
      console.error('Not enough users found in session');

      const { message, status } = ErrorDetails[ErrorType.BAD_REQUEST];
      return NextResponse.json({ error: message }, { status });
    }

    const computedLocation = await computeLocation(sessionId, locations);

    return NextResponse.json({ computed_location: computedLocation }, { status: 200 });
  } catch (error) {
    console.error('Error computing session:', error);

    const { message, status } = ErrorDetails[ErrorType.INTERNAL_SERVER_ERROR];
    return NextResponse.json({ error: message }, { status });
  }
}
