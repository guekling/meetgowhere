// run migrations
import { execSync } from 'child_process';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import db from '@/app/server/db/models';
import { UserRoles } from '@/app/types';
import * as userService from '@/app/server/services/user';

// mock Next.JS cookies API
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

import { POST as POST_SESSION } from '../sessions/route';
import { POST as POST_JOIN } from '../sessions/[id]/join/route';

beforeAll(() => {
  execSync('npx sequelize-cli db:migrate --env test');
});

afterAll(async () => {
  await db.sequelize.close();
  execSync('npx sequelize-cli db:migrate:undo:all --env test');
});

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
  let sessionId;
  let inviteToken;
  let existingUserToken;

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

  afterEach(async () => {
    jest.resetAllMocks();
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
