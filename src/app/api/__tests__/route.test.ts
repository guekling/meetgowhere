// run migrations
import { execSync } from 'child_process';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import db from '@/app/server/db/models';
import { ErrorDetails, ErrorType, LatLng, UserRoles } from '@/app/types';
import * as userService from '@/app/server/services/user';

// mock Next.JS cookies API
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

import { POST as POST_SESSION } from '../sessions/route';
import { POST as POST_JOIN } from '../sessions/[id]/join/route';
import { GET as GET_VALIDATE } from '../sessions/[id]/validate/route';
import { POST as POST_COMPUTE } from '../sessions/[id]/compute/route'
import { GET as GET_SESSION } from '../sessions/[id]/route';

beforeAll(() => {
  execSync('npx sequelize-cli db:migrate --env test');
});

afterAll(async () => {
  await db.sequelize.close();
  execSync('npx sequelize-cli db:migrate:undo:all --env test');
});

function generateRandomCoordinates(): LatLng {
  // Latitude ranges from -90 to +90
  const latitude = Math.random() * 180 - 90;

  // Longitude ranges from -180 to +180
  const longitude = Math.random() * 360 - 180;

  return { lat: latitude, lng: longitude };
}

describe('POST /api/sessions', () => {
  it('should create a session and return sessionId and inviteToken', async () => {
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('sessionId');
    expect(data).toHaveProperty('inviteToken');
  });

  it('should set a userToken cookie', async () => {
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    expect(res.status).toBe(200);

    const cookie = res.headers.get('Set-Cookie');
    const match = cookie?.match(/userToken=([^;]*)/);
    expect(match).not.toBeNull();
    expect(match[1]).toBeTruthy();
    expect(match[1]).not.toBe('');
  });

  it('should create a new initiator user and new session', async () => {
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    expect(res.status).toBe(200);

    const session = await db.Session.findByPk(data.sessionId);
    expect(session).not.toBeNull();
    const user = await db.User.findByPk(session?.getDataValue('created_by'));
    expect(user).not.toBeNull();
    expect(user?.getDataValue('username')).toBe('testuser');
    expect(user?.getDataValue('role')).toBe(UserRoles.INITIATOR);
  });
});

describe('POST /api/sessions/:id/join', () => {
  let sessionId: string;
  let inviteToken: string;
  let existingUserToken: string;

  beforeAll(async () => {
    // create new session
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'testuser' }),
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    sessionId = data.sessionId;
    inviteToken = data.inviteToken;
  });

  it('should join a session and set userToken cookie', async () => {
    const req = new NextRequest(
      `http://localhost/api/sessions/${sessionId}/join?token=${inviteToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'participant' }),
      }
    );
    const res = await POST_JOIN(req, { params: Promise.resolve({ id: sessionId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('message', 'ok');

    const cookie = res.headers.get('Set-Cookie');
    const match = cookie?.match(/userToken=([^;]*)/);
    expect(match).not.toBeNull();
    expect(match[1]).toBeTruthy();
    expect(match[1]).not.toBe('');

    // Check user exists in DB
    const user = await db.User.findOne({
      where: { username: 'participant', role: UserRoles.PARTICIPANT, session_id: sessionId },
    });
    expect(user).not.toBeNull();

    existingUserToken = match[1];
  });

  it('should not do anything if a userToken is validated and already set', async () => {
    (cookies as jest.Mock).mockImplementation(() => ({
      get: jest.fn(() => ({ value: existingUserToken })),
    }));

    const createUserSpy = jest.spyOn(userService, 'createUser');
    const req = new NextRequest(
      `http://localhost/api/sessions/${sessionId}/join?token=${inviteToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `userToken=${existingUserToken}`,
        },
        body: JSON.stringify({ username: 'participant' }),
      }
    );
    const res = await POST_JOIN(req, { params: Promise.resolve({ id: sessionId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('message', 'ok');
    expect(createUserSpy).not.toHaveBeenCalled();

    const cookie = res.headers.get('Set-Cookie');
    const match = cookie?.match(/userToken=([^;]*)/);
    expect(match[1]).toBe(existingUserToken);
  });
});

describe('POST /api/sessions/:id/validate', () => {
  let sessionId: string;
  let inviteToken: string;

  beforeAll(async () => {
    // create new session
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'testuser' }),
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    sessionId = data.sessionId;
    inviteToken = data.inviteToken;
  });

  it('should return 200 if token is valid', async () => {
    const req = new NextRequest(`http://localhost/api/session/${sessionId}?token=${inviteToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await GET_VALIDATE(req, { params: Promise.resolve({ id: sessionId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('message', 'ok');
  });

  it('should return 400 if token is missing', async () => {
    const req = new NextRequest(`http://localhost/api/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await GET_VALIDATE(req, { params: Promise.resolve({ id: sessionId }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error', 'Missing invite token');
  });

  it('should return 400 if token is invalid', async () => {
    const req = new NextRequest(`http://localhost/api/session/${sessionId}?token=invalid`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await GET_VALIDATE(req, { params: Promise.resolve({ id: sessionId }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error', 'Invalid invite token');
  });
});

describe('POST /api/sessions/:id/compute', () => {
  let sessionId: string;
  let inviteToken: string;
  let initiatorUserToken: string;

  beforeAll(async () => {
    // create new session
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'initiator', location: generateRandomCoordinates() }),
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    sessionId = data.sessionId;
    inviteToken = data.inviteToken;

    const cookie = res.headers.get('Set-Cookie');
    initiatorUserToken = cookie?.match(/userToken=([^;]*)/)[1];

    // join sessions
    const usernames = ['userA', 'userB'];
    for (const username of usernames) {
      // reset Next.JS cookies API mock
      (cookies as jest.Mock).mockImplementation(() => ({
        get: jest.fn(),
      }));

      const joinReq = new NextRequest(`http://localhost/api/sessions/${sessionId}/join?token=${inviteToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, location: generateRandomCoordinates() }),
      });
      const joinRes = await POST_JOIN(joinReq, { params: Promise.resolve({ id: sessionId }) });
      expect(joinRes.status).toBe(200);
      const joinData = await joinRes.json();
      expect(joinData).toHaveProperty('message', 'ok');
    }
  });

  it('should return 403 if user is not authenticated', async () => {
    const req = new NextRequest(`http://localhost/api/sessions/${sessionId}/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const res = await POST_COMPUTE(req, { params: { id: sessionId } });
    expect(res.status).toBe(ErrorDetails[ErrorType.UNAUTHORIZED].status);
    const data = await res.json();
    expect(data).toHaveProperty('error', ErrorDetails[ErrorType.UNAUTHORIZED].message);
  });

  it('should return 200 and computed location if successful', async () => {
    (cookies as jest.Mock).mockImplementation(() => ({
      get: jest.fn(() => ({ value: initiatorUserToken })),
    }));

    const req = new NextRequest(`http://localhost/api/sessions/${sessionId}/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `userToken=${initiatorUserToken}`
      },
      body: JSON.stringify({}),
    });
    const res = await POST_COMPUTE(req, { params: { id: sessionId } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('computedLocation');
  });

  it('should return 400 if session not found', async () => {
    const invalidSessionId = uuidv4();
    const req = new NextRequest(`http://localhost/api/sessions/${invalidSessionId}/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const res = await POST_COMPUTE(req, { params: { id: invalidSessionId } });
    expect(res.status).toBe(ErrorDetails[ErrorType.INVALID_INVITE_TOKEN].status);
    const data = await res.json();
    expect(data).toHaveProperty('error', ErrorDetails[ErrorType.INVALID_INVITE_TOKEN].message);
  });

  it('should return 400 if location has already been computed', async () => {
    const req = new NextRequest(`http://localhost/api/sessions/${sessionId}/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `userToken=${initiatorUserToken}`
      },
      body: JSON.stringify({}),
    });
    const res = await POST_COMPUTE(req, { params: { id: sessionId } });
    expect(res.status).toBe(ErrorDetails[ErrorType.BAD_REQUEST].status);
    const data = await res.json();
    expect(data).toHaveProperty('error', ErrorDetails[ErrorType.BAD_REQUEST].message);
  });
});

describe('GET /api/sessions/:id', () => {
  let sessionId: string;
  let initiatorUserToken: string;

  beforeAll(async () => {
    // create new session
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'testuser' }),
    });
    const res = await POST_SESSION(req);
    const data = await res.json();
    sessionId = data.sessionId;

    const cookie = res.headers.get('Set-Cookie');
    initiatorUserToken = cookie?.match(/userToken=([^;]*)/)[1];
  });

  it('should retrieve session info', async () => {
    (cookies as jest.Mock).mockImplementation(() => ({
      get: jest.fn(() => ({ value: initiatorUserToken })),
    }));

    const req = new NextRequest(`http://localhost/api/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `userToken=${initiatorUserToken}`
      },
    });
    const res = await GET_SESSION(req, { params: Promise.resolve({ id: sessionId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('session');
  });
});
