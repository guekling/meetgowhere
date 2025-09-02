// run migrations
import { execSync } from 'child_process';

import db from '@/app/server/db/models';
import { UserRoles } from '@/app/types';

import { POST as POST_SESSION } from '../sessions/route';

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
